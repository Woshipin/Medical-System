using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MedicalSystem.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization; // 【新增】需要引入此命名空间使用 [Authorize]

namespace MedicalSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly IConfiguration _configuration;

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

        // 2. 后台人员登录
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AdminLoginDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
                return Unauthorized(ApiResponse<string>.FailureResponse("账号或密码错误"));

            if (user.Role == UserRole.Patient)
                return Unauthorized(ApiResponse<string>.FailureResponse("无权访问后台系统，请使用患者通道登录"));

            var token = GenerateJwtToken(user);

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

        // 3. 【关键新增】：探测接口，判断当前 Token/账号 是否在数据库中有效
        [HttpGet("me")]
        [Authorize] // 必须带有 Token，并且经过 Program.cs 中查库验证后才能进入这里
        public IActionResult GetCurrentUser()
        {
            // 如果能执行到这里，说明账号在数据库里还活着
            return Ok(ApiResponse<string>.SuccessResponse(null, "账号状态正常"));
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