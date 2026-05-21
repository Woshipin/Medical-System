using System; 
using System.Collections.Generic; 
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

namespace MedicalSystem.Controllers 
{
    [Route("api/[controller]")] 
    [ApiController] 
    public class AuthController : ControllerBase 
    {
        private readonly UserManager<User> _userManager; 
        private readonly IConfiguration _configuration; 
        private readonly IActivityLogService _activityLog; 

        public AuthController(UserManager<User> userManager, IConfiguration configuration, IActivityLogService activityLog) 
        {
            _userManager = userManager; 
            _configuration = configuration; 
            _activityLog = activityLog; 
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
                CreatedAt = DateTime.Now, 
                UpdatedAt = DateTime.Now 
            };

            var result = await _userManager.CreateAsync(user, model.Password); 
            if (result.Succeeded) 
            {
                await _activityLog.LogExplicitAsync(user.Id, user.FullName, "Patient", "Register", $"Registered a new patient account:\n• User ID -> {user.Id}\n• Full Name -> {user.FullName}\n• Email -> {user.Email}\n• Phone -> {user.PhoneNumber ?? "None"}\n• Gender ID -> {user.GenderId}\n• Role -> Patient\n• Status -> Active");

                return Ok(ApiResponse<string>.SuccessResponse(null, "注册成功")); 
            }

            return BadRequest(ApiResponse<List<string>>.FailureResponse("注册失败", result.Errors.Select(e => e.Description).ToList())); 
        }

        [HttpPost("login")] 
        public async Task<IActionResult> Login([FromBody] LoginDto model) 
        {
            var user = await _userManager.FindByEmailAsync(model.Email); 
            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password)) 
            {
                await _activityLog.LogExplicitAsync(null, "Anonymous", "Visitor", "LoginFail", $"Failed login attempt - Details: [AttemptedEmail: '{model.Email}']");

                return Unauthorized(ApiResponse<string>.FailureResponse("账号或密码错误")); 
            }

            if (user.Role != UserRole.Patient) 
            {
                await _activityLog.LogExplicitAsync(user.Id, user.FullName, user.Role.ToString(), "LoginFail", $"Blocked attempt to access patient portal with non-patient role - Details: [Email: '{user.Email}', ActualRole: '{user.Role}']");

                return Unauthorized(ApiResponse<string>.FailureResponse("请前往后台系统登录")); 
            }

            var token = GenerateJwtToken(user); 
            
            await _activityLog.LogExplicitAsync(user.Id, user.FullName, "Patient", "Login", "Successfully logged into the patient portal.");

            return Ok(ApiResponse<object>.SuccessResponse(new { 
                token = token, 
                user = new { 
                    id = user.Id,
                    fullName = user.FullName,
                    email = user.Email,
                    roleValue = (int)user.Role 
                } 
            })); 
        }

        [HttpGet("me")] 
        [Authorize] 
        public IActionResult GetCurrentUser() 
        {
            return Ok(ApiResponse<string>.SuccessResponse(null, "账号状态正常")); 
        }

        private string GenerateJwtToken(User user) 
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)); 
            var claims = new[] { 
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()), 
                new Claim(ClaimTypes.Role, user.Role.ToString()) 
            };
            var token = new JwtSecurityToken(_configuration["Jwt:Issuer"], _configuration["Jwt:Audience"], claims, 
                expires: DateTime.Now.AddDays(1), signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)); 
            return new JwtSecurityTokenHandler().WriteToken(token); 
        }
    }

    // ==========================================
    // 【修复新增】：在此补全缺失的 DTO 类定义
    // ==========================================
    public class FrontendRegisterDto { 
        public string FullName { get; set; } = null!; 
        public string Email { get; set; } = null!; 
        public string Password { get; set; } = null!; 
        public string PhoneNumber { get; set; } = null!; 
        public int GenderId { get; set; } 
    }

    public class LoginDto { 
        public string Email { get; set; } = null!; 
        public string Password { get; set; } = null!; 
    }
}