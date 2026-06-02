using System; 
using System.Linq; 
using System.Threading.Tasks; 
using Microsoft.AspNetCore.Identity; 
using Microsoft.AspNetCore.Mvc; 
using MedicalSystem.Models; 
using System.IdentityModel.Tokens.Jwt; 
using System.Security.Claims; 
using System.Text; 
using Microsoft.IdentityModel.Tokens; 
using Microsoft.AspNetCore.Authorization; 
using MedicalSystem.Services; 
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MedicalSystem.Controllers 
{
    [Route("api/[controller]")] 
    [ApiController] 
    public class AdminController : ControllerBase 
    {
        private readonly UserManager<User> _userManager; 
        private readonly IConfiguration _configuration; 
        private readonly IActivityLogService _activityLog; 
        private readonly Data.AppDbContext _context; 
        private readonly ILogger<AdminController> _logger; 

        public AdminController(
            UserManager<User> userManager, 
            IConfiguration configuration, 
            IActivityLogService activityLog, 
            Data.AppDbContext context,
            ILogger<AdminController> logger) 
        {
            _userManager = userManager; 
            _configuration = configuration; 
            _activityLog = activityLog; 
            _context = context;
            _logger = logger;
        }

        // 修复：将 string? userId 改成了 int? userId，解决 CS1503 报错
        private async Task LogBothAsync(string functionName, string status, string message, int? userId = null, string userName = "Anonymous", string role = "System")
        {
            _logger.LogInformation("[AdminController.{FunctionName}] {Status}: {Message}", functionName, status, message);

            await _activityLog.LogExplicitAsync(
                userId, 
                userName, 
                role, 
                functionName, 
                $"[{status}] {message}"
            );
        }

        [HttpPost("register")] 
        public async Task<IActionResult> Register([FromBody] AdminRegisterDto model) 
        {
            if (!Enum.TryParse<UserRole>(model.Role, true, out var userRole)) 
            {
                await LogBothAsync("Register", "Failed", $"Invalid role '{model.Role}' for email {model.Email}");
                return BadRequest(ApiResponse<string>.FailureResponse("Invalid user role.")); 
            }

            var existingUser = await _userManager.FindByEmailAsync(model.Email);
            if (existingUser != null)
            {
                await LogBothAsync("Register", "Failed", $"Email already exists: {model.Email}");
                return BadRequest(ApiResponse<string>.FailureResponse("Email already exists."));
            }

            var user = new User 
            {
                UserName = model.Email, 
                Email = model.Email, 
                FullName = model.FullName, 
                PhoneNumber = model.PhoneNumber, 
                Role = userRole,            
                GenderId = 1,              
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
                    await LogBothAsync("Register", "Failed", $"Account creation failed: {errors}");
                    return BadRequest(ApiResponse<List<string>>.FailureResponse("Account creation failed.", result.Errors.Select(e => e.Description).ToList()));
                }

                if (userRole == UserRole.Patient)
                {
                    var profile = new PatientProfile
                    {
                        UserId = user.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.PatientProfiles.Add(profile);
                }
                else if (userRole == UserRole.Doctor)
                {
                    var doctor = new Doctor
                    {
                        UserId = user.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.Doctors.Add(doctor);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // 修复：user.Id 已经是 int 类型，直接传入
                await LogBothAsync(
                    "Register", 
                    "Success", 
                    $"Created new staff account - User ID: {user.Id}, Full Name: {user.FullName}, Email: {user.Email}, Role: {user.Role}",
                    user.Id,
                    user.FullName,
                    user.Role.ToString()
                );

                return Ok(ApiResponse<string>.SuccessResponse(null, "Admin account created successfully.")); 
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await LogBothAsync("Register", "Error", $"Relative Profile mapping failed to save: {ex.Message}");
                return StatusCode(500, ApiResponse<string>.FailureResponse("An error occurred during account creation."));
            }
        }

        [HttpPost("login")] 
        public async Task<IActionResult> Login([FromBody] AdminLoginDto model) 
        {
            var user = await _userManager.FindByEmailAsync(model.Email); 
            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password)) 
            {
                await LogBothAsync("Login", "Failed", $"Failed admin portal login attempt - AttemptedEmail: '{model.Email}'");
                return Unauthorized(ApiResponse<string>.FailureResponse("Invalid email or password.")); 
            }

            if (user.Role == UserRole.Patient) 
            {
                await LogBothAsync(
                    "Login", 
                    "Failed", 
                    $"Blocked patient login attempt on admin portal - Email: '{user.Email}'", 
                    user.Id, 
                    user.FullName, 
                    "Patient"
                );
                return Unauthorized(ApiResponse<string>.FailureResponse("Unauthorized access. Please use the patient portal.")); 
            }

            var token = GenerateJwtToken(user); 

            await LogBothAsync(
                "Login", 
                "Success", 
                $"Logged into the admin portal - Email: {user.Email}, Role: {user.Role}",
                user.Id,
                user.FullName,
                user.Role.ToString()
            );

            return Ok(ApiResponse<object>.SuccessResponse(new { 
                token = token, 
                user = new { 
                    id = user.Id.ToString(), 
                    fullName = user.FullName, 
                    email = user.Email, 
                    Role = user.Role.ToString()?.ToLower() 
                } 
            }, "Admin login successful.")); 
        }

        [HttpGet("check-auth")]
        [Authorize] 
        public async Task<IActionResult> CheckAuth()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            var user = await _userManager.FindByIdAsync(userIdStr!);
            
            if (user == null || user.Status != 1 || user.Role == UserRole.Patient)
            {
                await LogBothAsync("CheckAuth", "Failed", $"Invalid or unauthorized token access attempt. UserID: {userIdStr}");
                return Unauthorized(ApiResponse<string>.FailureResponse("Please login to the admin system first."));
            }

            await LogBothAsync(
                "CheckAuth", 
                "Success", 
                $"Token validated for Admin {user.Email}",
                user.Id,
                user.FullName,
                user.Role.ToString()
            );

            return Ok(ApiResponse<object>.SuccessResponse(new {
                user = new {
                    id = user.Id.ToString(), 
                    fullName = user.FullName, 
                    email = user.Email, 
                    Role = user.Role.ToString()?.ToLower() 
                }
            }, "Authentication valid."));
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!string.IsNullOrEmpty(userIdStr))
            {
                var user = await _userManager.FindByIdAsync(userIdStr);
                if (user != null)
                {
                    await LogBothAsync(
                        "Logout", 
                        "Success", 
                        "Admin logged out state synchronized.", 
                        user.Id, 
                        user.FullName, 
                        user.Role.ToString()
                    );
                    return Ok(ApiResponse<string>.SuccessResponse(null, "Logged out successfully."));
                }
            }

            await LogBothAsync("Logout", "Success", "Admin logged out state synchronized.");
            return Ok(ApiResponse<string>.SuccessResponse(null, "Logged out successfully."));
        }

        private string GenerateJwtToken(User user) 
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)); 
            var claims = new[] { 
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()), 
                new Claim(ClaimTypes.Role, user.Role.ToString() ?? "Patient") 
            };
            var token = new JwtSecurityToken(_configuration["Jwt:Issuer"], _configuration["Jwt:Audience"], claims, 
                expires: DateTime.Now.AddDays(1), signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)); 
            return new JwtSecurityTokenHandler().WriteToken(token); 
        }
    }

    public class AdminRegisterDto 
    { 
        public string Email { get; set; } = null!; 
        public string Password { get; set; } = null!; 
        public string FullName { get; set; } = null!; 
        public string PhoneNumber { get; set; } = null!; 
        public string Role { get; set; } = null!; 
    }

    public class AdminLoginDto 
    { 
        public string Email { get; set; } = null!; 
        public string Password { get; set; } = null!; 
    }
}