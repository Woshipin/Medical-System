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
                full_name = model.FullName, 
                PhoneNumber = model.PhoneNumber, 
                role = userRole,            
                gender_id = 1,              
                status = true,              
                created_at = DateTime.Now,  
                updated_at = DateTime.Now   
            };

            var result = await _userManager.CreateAsync(user, model.Password); 
            if (result.Succeeded) 
            {
                await _activityLog.LogExplicitAsync(user.Id, user.full_name, user.role.ToString(), "Created", $"Created new staff account:\n• User ID -> {user.Id}\n• Full Name -> {user.full_name}\n• Email -> {user.Email}\n• Phone -> {user.PhoneNumber ?? "None"}\n• Role -> {user.role}\n• Status -> {(user.status == true ? "Active" : "Inactive")}");
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

            if (user.role == UserRole.Patient) 
            {
                await _activityLog.LogExplicitAsync(user.Id, user.full_name, "Patient", "LoginFail", $"Blocked patient login attempt on admin portal - Details: [Email: '{user.Email}']");
                return Unauthorized(ApiResponse<string>.FailureResponse("无权访问后台系统，请使用患者通道登录")); 
            }

            var token = GenerateJwtToken(user); 

            // ==========================================
            // 本地 HTTP 开发专用的 Cookie 配置（完全兼容 Chrome）
            // ==========================================
            var cookieOptions = new CookieOptions 
            { 
                HttpOnly = true, 
                Secure = false, // 【重点】：本地没有 HTTPS，这里必须是 false，否则 Chrome 直接丢弃！
                SameSite = SameSiteMode.Lax, // 【重点】：本地不同端口跨域，必须用 Lax
                Path = "/", // 【重点】：必须指定全站生效路径
                Expires = DateTime.Now.AddDays(1) 
            }; 
            Response.Cookies.Append("AuthToken", token, cookieOptions);

            await _activityLog.LogExplicitAsync(user.Id, user.full_name, user.role.ToString(), "Login", $"Logged into the admin portal:\n• User ID -> {user.Id}\n• Full Name -> {user.full_name}\n• Email -> {user.Email}\n• Role -> {user.role}");

            return Ok(ApiResponse<object>.SuccessResponse(new { 
                token = token, 
                user = new { 
                    id = user.Id.ToString(), 
                    fullName = user.full_name, 
                    email = user.Email, 
                    role = user.role.ToString()?.ToLower() 
                } 
            }, "登录成功")); 
        }

        // ==========================================
        // 【新增】：检查 Cookie 登录状态接口
        // ==========================================
        [HttpGet("check-auth")]
        [Authorize] // 只有携带了有效 Cookie/Token 才能访问
        public async Task<IActionResult> CheckAuth()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            var user = await _userManager.FindByIdAsync(userId!);
            
            if (user == null || user.status != true) return Unauthorized(ApiResponse<string>.FailureResponse("账号无效或已被禁用"));

            return Ok(ApiResponse<object>.SuccessResponse(new {
                user = new {
                    id = user.Id.ToString(), 
                    fullName = user.full_name, 
                    email = user.Email, 
                    role = user.role.ToString()?.ToLower() 
                }
            }, "认证有效"));
        }

        // ==========================================
        // 【新增】：注销退出，清除 Cookie 接口
        // ==========================================
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("AuthToken", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None
            });
            return Ok(ApiResponse<string>.SuccessResponse(null, "成功退出登录"));
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
                new Claim(ClaimTypes.Role, user.role.ToString() ?? "Patient") 
            };
            var token = new JwtSecurityToken(_configuration["Jwt:Issuer"], _configuration["Jwt:Audience"], claims, 
                expires: DateTime.Now.AddDays(1), signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)); 
            return new JwtSecurityTokenHandler().WriteToken(token); 
        }
    }

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