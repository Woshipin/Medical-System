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
using Microsoft.AspNetCore.Http; 
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.IO; 

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

        public AuthController(
            UserManager<User> userManager, 
            IActivityLogService activityLog, 
            Data.AppDbContext context,
            ITokenService tokenService) 
        {
            _userManager = userManager; 
            _activityLog = activityLog; 
            _context = context; 
            _tokenService = tokenService;
        }

        private void LogToFile(string functionName, string message)
        {
            try
            {
                string logPath = Path.Combine(Directory.GetCurrentDirectory(), "backend.log");
                string logEntry = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [AuthController.{functionName}] {message}{Environment.NewLine}";
                System.IO.File.AppendAllText(logPath, logEntry);
            }
            catch { }
        }

        [HttpPost("register")] 
        public async Task<IActionResult> Register([FromBody] FrontendRegisterDto model) 
        {
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

            var result = await _userManager.CreateAsync(user, model.Password); 
            if (result.Succeeded) 
            {
                // 【修复】：恢复患者注册的系统日志和完整详情
                var genderName = await _context.Genders
                    .Where(g => g.id == model.GenderId)
                    .Select(g => g.name)
                    .FirstOrDefaultAsync() ?? "Unknown";

                await _activityLog.LogExplicitAsync(
                    user.Id, 
                    user.FullName, 
                    "Patient", 
                    "Register", 
                    $"Registered a new patient account:\n• User ID -> {user.Id}\n• Full Name -> {user.FullName}\n• Email -> {user.Email}\n• Phone -> {user.PhoneNumber ?? "None"}\n• Gender -> {genderName}\n• Role -> Patient\n• Status -> Active"
                );

                LogToFile("Register", $"Success: Patient account created for {user.Email}");
                return Ok(ApiResponse<string>.SuccessResponse(null, "Registration successful")); 
            }

            LogToFile("Register", $"Failed: Error creating patient {user.Email}");
            return BadRequest(ApiResponse<List<string>>.FailureResponse("注册失败", result.Errors.Select(e => e.Description).ToList())); 
        }

        [HttpPost("login")] 
        public async Task<IActionResult> Login([FromBody] LoginDto model) 
        {
            var user = await _userManager.FindByEmailAsync(model.Email); 
            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password)) 
            {
                // 【恢复】：记录密码错误的系统日志
                await _activityLog.LogExplicitAsync(null, "Anonymous", "Visitor", "LoginFail", $"Failed login attempt - Details: [AttemptedEmail: '{model.Email}']");
                LogToFile("Login", $"Failed: Invalid credentials for patient {model.Email}");
                return Unauthorized(ApiResponse<string>.FailureResponse("账号或密码错误")); 
            }

            if (user.Role != UserRole.Patient) 
            {
                // 【恢复】：记录串台拦截的系统日志
                await _activityLog.LogExplicitAsync(user.Id, user.FullName, user.Role.ToString(), "LoginFail", $"Blocked attempt to access patient portal - Details: [Email: '{user.Email}', ActualRole: '{user.Role}']");
                LogToFile("Login", $"Failed: Admin/Doctor account {model.Email} attempted to access Patient portal");
                return Unauthorized(ApiResponse<string>.FailureResponse("请前往后台系统登录")); 
            }

            var accessToken = _tokenService.GenerateAccessToken(user);
            var refreshToken = await _tokenService.GenerateRefreshTokenAsync(user.Id);

            _tokenService.SetTokenCookies(HttpContext, accessToken, refreshToken);
            
            // 【修复】：恢复患者登录的系统日志完整详情
            await _activityLog.LogExplicitAsync(
                user.Id, 
                user.FullName, 
                "Patient", 
                "Login", 
                $"Logged into the patient portal:\n• User ID -> {user.Id}\n• Full Name -> {user.FullName}\n• Email -> {user.Email}\n• Role -> Patient"
            );

            LogToFile("Login", $"Success: Patient {user.Email} logged in successfully");

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
                LogToFile("Refresh", "Failed: RefreshToken cookie missing");
                return Unauthorized(ApiResponse<string>.FailureResponse("凭证缺失，请重新登录"));
            }

            var savedToken = await _context.UserRefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == oldRefreshTokenString && !rt.IsRevoked);

            if (savedToken == null || savedToken.ExpiresAt < DateTime.UtcNow || savedToken.User.Status != 1)
            {
                LogToFile("Refresh", "Failed: RefreshToken expired, invalid or user disabled");
                return Unauthorized(ApiResponse<string>.FailureResponse("凭证已过期或无效，请重新登录"));
            }

            savedToken.IsRevoked = true;
            _context.UserRefreshTokens.Update(savedToken);

            var newAccessToken = _tokenService.GenerateAccessToken(savedToken.User);
            var newRefreshTokenString = await _tokenService.GenerateRefreshTokenAsync(savedToken.UserId);

            _tokenService.SetTokenCookies(HttpContext, newAccessToken, newRefreshTokenString);

            LogToFile("Refresh", $"Success: Tokens refreshed for user {savedToken.User.Email}");
            return Ok(ApiResponse<string>.SuccessResponse(null, "Token refreshed successfully"));
        }

        [HttpGet("check-auth")]
        [Authorize] 
        public async Task<IActionResult> CheckAuth()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            var user = await _userManager.FindByIdAsync(userId!);
            
            if (user == null || user.Status != 1 || user.Role != UserRole.Patient) 
            {
                LogToFile("CheckAuth", $"Failed: Unauthorized access or wrong role (Expected Patient). UserID: {userId}");
                return Unauthorized(ApiResponse<string>.FailureResponse("账号无效或非患者角色，请重新登录"));
            }

            LogToFile("CheckAuth", $"Success: Token validated for Patient {user.Email}");
            return Ok(ApiResponse<object>.SuccessResponse(new {
                user = new {
                    id = user.Id,
                    fullName = user.FullName,
                    email = user.Email,
                    roleValue = (int)user.Role
                }
            }, "认证有效"));
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            if (Request.Cookies.TryGetValue("RefreshToken", out var refreshTokenString))
            {
                var tokenInDb = await _context.UserRefreshTokens
                    .FirstOrDefaultAsync(rt => rt.Token == refreshTokenString);
                if (tokenInDb != null)
                {
                    tokenInDb.IsRevoked = true;
                    _context.UserRefreshTokens.Update(tokenInDb);
                    await _context.SaveChangesAsync();
                }
            }

            _tokenService.ClearTokenCookies(HttpContext);
            LogToFile("Logout", "Success: Patient logged out and tokens cleared.");
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