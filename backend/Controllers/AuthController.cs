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
using Microsoft.AspNetCore.Http; 

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
                full_name = model.FullName, 
                PhoneNumber = model.PhoneNumber, 
                gender_id = model.GenderId, 
                role = UserRole.Patient, 
                status = true,
                created_at = DateTime.Now, 
                updated_at = DateTime.Now 
            };

            var result = await _userManager.CreateAsync(user, model.Password); 
            if (result.Succeeded) 
            {
                await _activityLog.LogExplicitAsync(user.Id, user.full_name, "Patient", "Register", $"Registered a new patient account:\n• User ID -> {user.Id}\n• Full Name -> {user.full_name}\n• Email -> {user.Email}\n• Phone -> {user.PhoneNumber ?? "None"}\n• Gender ID -> {user.gender_id}\n• Role -> Patient\n• Status -> Active");
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

            if (user.role != UserRole.Patient) 
            {
                await _activityLog.LogExplicitAsync(user.Id, user.full_name, user.role.ToString(), "LoginFail", $"Blocked attempt to access patient portal with non-patient role - Details: [Email: '{user.Email}', ActualRole: '{user.role}']");
                return Unauthorized(ApiResponse<string>.FailureResponse("请前往后台系统登录")); 
            }

            var token = GenerateJwtToken(user); 

            // 【优化】：本地开发统一 Cookie 最佳配置，加入 Path = "/"
            var cookieOptions = new CookieOptions 
            { 
                HttpOnly = true, 
                Secure = false, 
                SameSite = SameSiteMode.Lax, 
                Path = "/",
                Expires = DateTime.Now.AddDays(1) 
            }; 
            Response.Cookies.Append("AuthToken", token, cookieOptions);
            
            await _activityLog.LogExplicitAsync(user.Id, user.full_name, "Patient", "Login", "Successfully logged into the patient portal.");

            // 【优化】：删除了返回数据载荷中的明文 token 字段，完全通过安全的 HttpOnly Cookie 托管
            return Ok(ApiResponse<object>.SuccessResponse(new { 
                user = new { 
                    id = user.Id,
                    fullName = user.full_name,
                    email = user.Email,
                    roleValue = (int)(user.role ?? UserRole.Patient) 
                } 
            }, "登录成功")); 
        }

        // ==========================================
        // 检查 Cookie 登录状态接口
        // ==========================================
        [HttpGet("check-auth")]
        [Authorize] 
        public async Task<IActionResult> CheckAuth()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            var user = await _userManager.FindByIdAsync(userId!);
            
            if (user == null || user.status != true) return Unauthorized(ApiResponse<string>.FailureResponse("账号无效或已被禁用"));

            return Ok(ApiResponse<object>.SuccessResponse(new {
                user = new {
                    id = user.Id,
                    fullName = user.full_name,
                    email = user.Email,
                    roleValue = (int)(user.role ?? UserRole.Patient)
                }
            }, "认证有效"));
        }

        // ==========================================
        // 注销退出，清除 Cookie 接口
        // ==========================================
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // 【优化】：删除 Cookie 的配置参数与写入时保持完全一致，保障完美清除
            Response.Cookies.Delete("AuthToken", new CookieOptions
            {
                HttpOnly = true,
                Secure = false,
                SameSite = SameSiteMode.Lax,
                Path = "/"
            });
            return Ok(ApiResponse<string>.SuccessResponse(null, "成功退出登录"));
        }

        private string GenerateJwtToken(User user) 
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)); 
            var claims = new[] { 
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()), 
                new Claim(ClaimTypes.Role, user.role.ToString() ?? "Patient") 
            };
            var token = new JwtSecurityToken(_configuration["Jwt:Issuer"], _configuration["Jwt:Audience"], claims, 
                expires: DateTime.Now.AddDays(1), signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)); 
            return new JwtSecurityTokenHandler().WriteToken(token); 
        }
    }

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