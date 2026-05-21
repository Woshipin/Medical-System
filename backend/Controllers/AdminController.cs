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

namespace MedicalSystem.Controllers 
{
    [Route("api/[controller]")] 
    [ApiController] 
    public class AdminController : ControllerBase 
    {
        private readonly UserManager<User> _userManager; 
        private readonly IConfiguration _configuration; 
        private readonly IActivityLogService _activityLog; 

        public AdminController(UserManager<User> userManager, IConfiguration configuration, IActivityLogService activityLog) 
        {
            _userManager = userManager; 
            _configuration = configuration; 
            _activityLog = activityLog; 
        }

        [HttpPost("register")] 
        public async Task<IActionResult> Register([FromBody] AdminRegisterDto model) 
        {
            if (!Enum.TryParse<UserRole>(model.Role, true, out var userRole)) 
                return BadRequest(ApiResponse<string>.FailureResponse("无效角色")); 

            var user = new User 
            {
                UserName = model.Email, 
                Email = model.Email, 
                FullName = model.FullName, 
                PhoneNumber = model.PhoneNumber, 
                Role = userRole, 
                GenderId = 1, 
                CreatedAt = DateTime.Now, 
                UpdatedAt = DateTime.Now 
            };

            var result = await _userManager.CreateAsync(user, model.Password); 
            if (result.Succeeded) 
            {
                await _activityLog.LogExplicitAsync(user.Id, user.FullName, user.Role.ToString(), "Created", $"Created new staff account:\n• User ID -> {user.Id}\n• Full Name -> {user.FullName}\n• Email -> {user.Email}\n• Phone -> {user.PhoneNumber ?? "None"}\n• Role -> {user.Role}\n• Status -> Active");

                return Ok(ApiResponse<string>.SuccessResponse(null, "后台账号创建成功")); 
            }

            return BadRequest(ApiResponse<List<string>>.FailureResponse("创建失败", result.Errors.Select(e => e.Description).ToList())); 
        }

        [HttpPost("login")] 
        public async Task<IActionResult> Login([FromBody] AdminLoginDto model) 
        {
            var user = await _userManager.FindByEmailAsync(model.Email); 
            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password)) 
            {
                await _activityLog.LogExplicitAsync(null, "Anonymous", "Visitor", "LoginFail", $"Failed admin portal login attempt - Details: [AttemptedEmail: '{model.Email}']");

                return Unauthorized(ApiResponse<string>.FailureResponse("账号或密码错误")); 
            }

            if (user.Role == UserRole.Patient) 
            {
                await _activityLog.LogExplicitAsync(user.Id, user.FullName, "Patient", "LoginFail", $"Blocked patient login attempt on admin portal - Details: [Email: '{user.Email}']");

                return Unauthorized(ApiResponse<string>.FailureResponse("无权访问后台系统，请使用患者通道登录")); 
            }

            var token = GenerateJwtToken(user); 

            await _activityLog.LogExplicitAsync(user.Id, user.FullName, user.Role.ToString(), "Login", $"Logged into the admin portal:\n• User ID -> {user.Id}\n• Full Name -> {user.FullName}\n• Email -> {user.Email}\n• Role -> {user.Role}");

            return Ok(ApiResponse<object>.SuccessResponse(new { 
                token = token, 
                user = new { 
                    id = user.Id.ToString(), 
                    fullName = user.FullName, 
                    email = user.Email, 
                    role = user.Role.ToString().ToLower() 
                } 
            }, "登录成功")); 
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
            var token = new JwtSecurityToken( 
                _configuration["Jwt:Issuer"], 
                _configuration["Jwt:Audience"], 
                claims, 
                expires: DateTime.Now.AddDays(1), 
                signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256) 
            );
            return new JwtSecurityTokenHandler().WriteToken(token); 
        }
    }

    // ==========================================
    // 【修复新增】：在此补全缺失的 DTO 类定义
    // ==========================================
    public class AdminRegisterDto { 
        public string Email { get; set; } = null!; 
        public string Password { get; set; } = null!; 
        public string FullName { get; set; } = null!; 
        public string PhoneNumber { get; set; } = null!; 
        public string Role { get; set; } = null!; 
    }

    public class AdminLoginDto { 
        public string Email { get; set; } = null!; 
        public string Password { get; set; } = null!; 
    }
}