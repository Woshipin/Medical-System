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
using Microsoft.AspNetCore.Http; 
using System.IO; 
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;

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

        public AdminController(UserManager<User> userManager, IConfiguration configuration, IActivityLogService activityLog, Data.AppDbContext context) 
        {
            _userManager = userManager; 
            _configuration = configuration; 
            _activityLog = activityLog; 
            _context = context;
        }

        private void LogToFile(string functionName, string message)
        {
            try
            {
                string logPath = Path.Combine(Directory.GetCurrentDirectory(), "backend.log");
                string logEntry = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [AdminController.{functionName}] {message}{Environment.NewLine}";
                System.IO.File.AppendAllText(logPath, logEntry);
            }
            catch { }
        }

        [HttpPost("register")] 
        public async Task<IActionResult> Register([FromBody] AdminRegisterDto model) 
        {
            if (!Enum.TryParse<UserRole>(model.Role, true, out var userRole)) 
            {
                LogToFile("Register", $"Failed: Invalid role '{model.Role}' for email {model.Email}");
                return BadRequest(ApiResponse<string>.FailureResponse("Invalid user role.")); 
            }

            var existingUser = await _userManager.FindByEmailAsync(model.Email);
            if (existingUser != null) return BadRequest(ApiResponse<string>.FailureResponse("Email already exists."));

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

            var result = await _userManager.CreateAsync(user, model.Password); 
            if (!result.Succeeded)
            {
                LogToFile("Register", $"Failed: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                return BadRequest(ApiResponse<List<string>>.FailureResponse("Account creation failed.", result.Errors.Select(e => e.Description).ToList()));
            }

            try
            {
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
                    // 修复点：移除了 LicenseNumber, SpecialtyId, PositionId, DepartmentId, YearsOfExperience, DateOfBirth, DateJoin 等默认值赋能，使其自动存入 NULL
                    var doctor = new Doctor
                    {
                        UserId = user.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.Doctors.Add(doctor);
                }
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                LogToFile("Register", $"Warning: Relative Profile mapping failed to save: {ex.Message}");
            }

            await _activityLog.LogExplicitAsync(
                user.Id, 
                user.FullName, 
                user.Role.ToString(), 
                "Created", 
                $"Created new staff account:\n• User ID -> {user.Id}\n• Full Name -> {user.FullName}\n• Email -> {user.Email}\n• Phone -> {user.PhoneNumber ?? "None"}\n• Role -> {user.Role}\n• Status -> Active"
            );
            
            LogToFile("Register", $"Success: Admin account created for {user.Email} with role {user.Role}");
            return Ok(ApiResponse<string>.SuccessResponse(null, "Admin account created successfully.")); 
        }

        [HttpPost("login")] 
        public async Task<IActionResult> Login([FromBody] AdminLoginDto model) 
        {
            var user = await _userManager.FindByEmailAsync(model.Email); 
            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password)) 
            {
                await _activityLog.LogExplicitAsync(null, "Anonymous", "Visitor", "LoginFail", $"Failed admin portal login attempt - Details: [AttemptedEmail: '{model.Email}']");
                LogToFile("Login", $"Failed: Invalid credentials for {model.Email}");
                return Unauthorized(ApiResponse<string>.FailureResponse("Invalid email or password.")); 
            }

            if (user.Role == UserRole.Patient) 
            {
                await _activityLog.LogExplicitAsync(user.Id, user.FullName, "Patient", "LoginFail", $"Blocked patient login attempt on admin portal - Details: [Email: '{user.Email}']");
                LogToFile("Login", $"Failed: Patient account {model.Email} attempted to access Admin portal");
                return Unauthorized(ApiResponse<string>.FailureResponse("Unauthorized access. Please use the patient portal.")); 
            }

            var token = GenerateJwtToken(user); 

            await _activityLog.LogExplicitAsync(
                user.Id, 
                user.FullName, 
                user.Role.ToString(), 
                "Login", 
                $"Logged into the admin portal:\n• User ID -> {user.Id}\n• Full Name -> {user.FullName}\n• Email -> {user.Email}\n• Role -> {user.Role}"
            );
            
            LogToFile("Login", $"Success: Admin {user.Email} ({user.Role}) logged in successfully.");

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
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            var user = await _userManager.FindByIdAsync(userId!);
            
            if (user == null || user.Status != 1 || user.Role == UserRole.Patient)
            {
                LogToFile("CheckAuth", $"Failed: Invalid or unauthorized token access attempt. UserID: {userId}");
                return Unauthorized(ApiResponse<string>.FailureResponse("Please login to the admin system first."));
            }

            LogToFile("CheckAuth", $"Success: Token validated for Admin {user.Email}");
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
        public IActionResult Logout()
        {
            LogToFile("Logout", "Success: Admin logged out state synchronized.");
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