using System; 
using System.Collections.Generic; 
using System.Linq; 
using System.Threading.Tasks; 
using Microsoft.AspNetCore.Identity; 
using Microsoft.AspNetCore.Mvc; 
using MedicalSystem.Models; 
using System.Security.Claims; 
using Microsoft.AspNetCore.Authorization; 
using MedicalSystem.Services; 
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.Extensions.Logging;

namespace MedicalSystem.Controllers 
{
    [Route("api/[controller]")] 
    [ApiController] 
    public class AuthController : ControllerBase 
    {
        private readonly UserManager<User> _userManager; 
        private readonly IActivityLogService _activityLog; 
        private readonly Data.AppDbContext _context; 
        private readonly ITokenService _tokenService;
        private readonly ILogger<AuthController> _logger; 

        public AuthController(
            UserManager<User> userManager, 
            IActivityLogService activityLog, 
            Data.AppDbContext context,
            ITokenService tokenService,
            ILogger<AuthController> logger) 
        {
            _userManager = userManager; 
            _activityLog = activityLog; 
            _context = context; 
            _tokenService = tokenService;
            _logger = logger;
        }

        // 修复：将 string? userId 改成了 int? userId
        private async Task LogBothAsync(string functionName, string status, string message, int? userId = null, string userName = "Anonymous", string role = "System")
        {
            _logger.LogInformation("[AuthController.{FunctionName}] {Status}: {Message}", functionName, status, message);

            await _activityLog.LogExplicitAsync(
                userId, 
                userName, 
                role, 
                functionName, 
                $"[{status}] {message}"
            );
        }

        [HttpPost("register")] 
        public async Task<IActionResult> Register([FromBody] FrontendRegisterDto model) 
        {
            var existingUser = await _userManager.FindByEmailAsync(model.Email);
            if (existingUser != null)
            {
                await LogBothAsync("Register", "Failed", $"Email already registered: {model.Email}");
                return BadRequest(ApiResponse<string>.FailureResponse("Email already registered."));
            }

            var user = new User 
            {
                UserName = model.Email, 
                Email = model.Email, 
                FullName = model.FullName, 
                PhoneNumber = model.PhoneNumber, 
                GenderId = model.GenderId, 
                Role = UserRole.Patient, 
                Status = 1, 
                CreatedAt = DateTime.UtcNow, 
                UpdatedAt = DateTime.UtcNow 
            };

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var result = await _userManager.CreateAsync(user, model.Password); 
                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    await LogBothAsync("Register", "Failed", $"Errors -> {errors}");
                    return BadRequest(ApiResponse<List<string>>.FailureResponse("Registration failed.", result.Errors.Select(e => e.Description).ToList()));
                }

                var profile = new PatientProfile
                {
                    UserId = user.Id,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.PatientProfiles.Add(profile);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var genderName = await _context.Genders
                    .Where(g => g.id == model.GenderId)
                    .Select(g => g.name)
                    .FirstOrDefaultAsync() ?? "Unknown";

                await LogBothAsync(
                    "Register", 
                    "Success", 
                    $"Registered a new patient account - Email: {user.Email}, Gender: {genderName}",
                    user.Id,
                    user.FullName,
                    "Patient"
                );

                return Ok(ApiResponse<string>.SuccessResponse(null, "Registration successful")); 
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await LogBothAsync("Register", "Error", $"User created but profile failed to initialize: {ex.Message}");
                return StatusCode(500, ApiResponse<string>.FailureResponse("An error occurred during registration."));
            }
        }

        [HttpPost("login")] 
        public async Task<IActionResult> Login([FromBody] LoginDto model) 
        {
            var user = await _userManager.FindByEmailAsync(model.Email); 
            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password)) 
            {
                await LogBothAsync("Login", "Failed", $"Failed login attempt - AttemptedEmail: '{model.Email}'");
                return Unauthorized(ApiResponse<string>.FailureResponse("Invalid email or password.")); 
            }

            if (user.Role != UserRole.Patient) 
            {
                await LogBothAsync(
                    "Login", 
                    "Failed", 
                    $"Blocked attempt to access patient portal - Email: '{user.Email}', ActualRole: '{user.Role}'", 
                    user.Id, 
                    user.FullName, 
                    user.Role.ToString()
                );
                return Unauthorized(ApiResponse<string>.FailureResponse("Please use the admin system entrance.")); 
            }

            var accessToken = _tokenService.GenerateAccessToken(user);
            var refreshToken = await _tokenService.GenerateRefreshTokenAsync(user.Id);

            _tokenService.SetTokenCookies(HttpContext, accessToken, refreshToken);
            
            await LogBothAsync(
                "Login", 
                "Success", 
                $"Patient {user.Email} logged in successfully",
                user.Id,
                user.FullName,
                "Patient"
            );

            return Ok(ApiResponse<object>.SuccessResponse(new { 
                user = new { 
                    id = user.Id,
                    fullName = user.FullName,
                    email = user.Email,
                    roleValue = (int)user.Role 
                } 
            }, "Patient login successful")); 
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh()
        {
            if (!Request.Cookies.TryGetValue("RefreshToken", out var oldRefreshTokenString) || string.IsNullOrEmpty(oldRefreshTokenString))
            {
                await LogBothAsync("Refresh", "Failed", "RefreshToken cookie missing");
                return Unauthorized(ApiResponse<string>.FailureResponse("Session credentials missing, please re-login."));
            }

            var savedToken = await _context.UserRefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == oldRefreshTokenString && !rt.IsRevoked);

            if (savedToken == null || savedToken.ExpiresAt < DateTime.UtcNow || savedToken.User.Status != 1)
            {
                await LogBothAsync("Refresh", "Failed", "RefreshToken expired, invalid or user disabled");
                return Unauthorized(ApiResponse<string>.FailureResponse("Session credentials expired or invalid, please re-login."));
            }

            savedToken.IsRevoked = true;
            _context.UserRefreshTokens.Update(savedToken);

            var newAccessToken = _tokenService.GenerateAccessToken(savedToken.User);
            var newRefreshTokenString = await _tokenService.GenerateRefreshTokenAsync(savedToken.UserId);

            _tokenService.SetTokenCookies(HttpContext, newAccessToken, newRefreshTokenString);

            await LogBothAsync(
                "Refresh", 
                "Success", 
                $"Tokens refreshed for user {savedToken.User.Email}",
                savedToken.User.Id,
                savedToken.User.FullName,
                savedToken.User.Role.ToString()
            );

            return Ok(ApiResponse<string>.SuccessResponse(null, "Token refreshed successfully"));
        }

        [HttpGet("check-auth")]
        [Authorize] 
        public async Task<IActionResult> CheckAuth()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            var user = await _userManager.FindByIdAsync(userIdStr!);
            
            if (user == null || user.Status != 1 || user.Role != UserRole.Patient) 
            {
                await LogBothAsync("CheckAuth", "Failed", $"Unauthorized access or wrong role (Expected Patient). UserID: {userIdStr}");
                return Unauthorized(ApiResponse<string>.FailureResponse("Session invalid or incorrect privileges."));
            }

            await LogBothAsync(
                "CheckAuth", 
                "Success", 
                $"Token validated for Patient {user.Email}",
                user.Id,
                user.FullName,
                "Patient"
            );

            return Ok(ApiResponse<object>.SuccessResponse(new {
                user = new {
                    id = user.Id,
                    fullName = user.FullName,
                    email = user.Email,
                    roleValue = (int)user.Role
                }
            }, "Authentication valid."));
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            int? userId = null;
            string userName = "Anonymous";
            string userRole = "Patient";

            if (Request.Cookies.TryGetValue("RefreshToken", out var refreshTokenString))
            {
                var tokenInDb = await _context.UserRefreshTokens
                    .Include(rt => rt.User)
                    .FirstOrDefaultAsync(rt => rt.Token == refreshTokenString);

                if (tokenInDb != null)
                {
                    userId = tokenInDb.UserId;
                    userName = tokenInDb.User.FullName;
                    userRole = tokenInDb.User.Role.ToString();

                    tokenInDb.IsRevoked = true;
                    _context.UserRefreshTokens.Update(tokenInDb);
                    await _context.SaveChangesAsync();
                }
            }

            _tokenService.ClearTokenCookies(HttpContext);

            await LogBothAsync(
                "Logout", 
                "Success", 
                "Patient logged out and tokens cleared.",
                userId,
                userName,
                userRole
            );

            return Ok(ApiResponse<string>.SuccessResponse(null, "Patient logged out successfully"));
        }
    }

    public class FrontendRegisterDto 
    { 
        public string FullName { get; set; } = null!; 
        public string Email { get; set; } = null!; 
        public string Password { get; set; } = null!; 
        public string PhoneNumber { get; set; } = null!; 
        public int GenderId { get; set; } 
    }

    public class LoginDto 
    { 
        public string Email { get; set; } = null!; 
        public string Password { get; set; } = null!; 
    }
}