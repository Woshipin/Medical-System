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
using Microsoft.EntityFrameworkCore; // 新增：为了使用 EF 查库

namespace MedicalSystem.Controllers 
{
    [Route("api/[controller]")] 
    [ApiController] 
    public class AuthController : ControllerBase 
    {
        private readonly UserManager<User> _userManager; 
        private readonly IConfiguration _configuration; 
        private readonly IActivityLogService _activityLog; 
        private readonly Data.AppDbContext _context; // 新增：注入数据库上下文用于查表

        public AuthController(UserManager<User> userManager, IConfiguration configuration, IActivityLogService activityLog, Data.AppDbContext context) 
        {
            _userManager = userManager; 
            _configuration = configuration; 
            _activityLog = activityLog; 
            _context = context; // 绑定上下文
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
                // 【核心优化】：去数据库中把数字 ID 翻译为名称文本
                var genderName = await _context.Genders.Where(g => g.id == model.GenderId).Select(g => g.name).FirstOrDefaultAsync() ?? "Unknown";

                // 【核心优化】：日志记录中直接展示具体的性别名称，而不是 ID 数字
                await _activityLog.LogExplicitAsync(
                    user.Id, 
                    user.full_name, 
                    "Patient", 
                    "Register", 
                    $"Registered a new patient account:\n• User ID -> {user.Id}\n• Full Name -> {user.full_name}\n• Email -> {user.Email}\n• Phone -> {user.PhoneNumber ?? "None"}\n• Gender -> {genderName}\n• Role -> Patient\n• Status -> Active"
                );
                
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

            var cookieOptions = new CookieOptions 
            { 
                HttpOnly = true, 
                Secure = false, 
                SameSite = SameSiteMode.Lax, 
                Path = "/",
                Expires = DateTime.Now.AddDays(1) 
            }; 
            Response.Cookies.Append("AuthToken", token, cookieOptions);
            
            // 【核心优化】：患者端（User）的登录记录排版格式与 Admin 保持完全一致的详细化多行展示
            await _activityLog.LogExplicitAsync(
                user.Id, 
                user.full_name, 
                "Patient", 
                "Login", 
                $"Logged into the patient portal:\n• User ID -> {user.Id}\n• Full Name -> {user.full_name}\n• Email -> {user.Email}\n• Role -> Patient"
            );

            return Ok(ApiResponse<object>.SuccessResponse(new { 
                user = new { 
                    id = user.Id,
                    fullName = user.full_name,
                    email = user.Email,
                    roleValue = (int)(user.role ?? UserRole.Patient) 
                } 
            }, "登录成功")); 
        }

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

        [HttpPost("logout")]
        public IActionResult Logout()
        {
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