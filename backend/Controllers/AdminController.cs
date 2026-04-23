using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MedicalSystem.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace MedicalSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly IConfiguration _configuration; // 引入配置用于读取 JWT Secret

        public AdminController(UserManager<User> userManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _configuration = configuration;
        }

        // 1. 后台人员创建（管理员/医生）
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
                GenderId = 1, // 默认男
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (result.Succeeded)
                return Ok(ApiResponse<string>.SuccessResponse(null, "后台账号创建成功"));

            return BadRequest(ApiResponse<List<string>>.FailureResponse("创建失败", result.Errors.Select(e => e.Description).ToList()));
        }

        // 2. 后台人员登录 (新增的 Login 接口)
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AdminLoginDto model)
        {
            // 查找用户并验证密码
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
                return Unauthorized(ApiResponse<string>.FailureResponse("账号或密码错误"));

            // 权限拦截：普通病人不能登录后台系统
            if (user.Role == UserRole.Patient)
                return Unauthorized(ApiResponse<string>.FailureResponse("无权访问后台系统，请使用患者通道登录"));

            // 账号验证通过，生成 JWT Token
            var token = GenerateJwtToken(user);

            // 返回标准数据结构，精准适配前端
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

        // 辅助方法：生成 JWT Token
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

    // DTO: 接收前端注册数据
    public class AdminRegisterDto {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string PhoneNumber { get; set; } = null!;
        public string Role { get; set; } = null!; 
    }

    // DTO: 接收前端登录数据 (新增)
    public class AdminLoginDto { 
        public string Email { get; set; } = null!; 
        public string Password { get; set; } = null!; 
    }
}