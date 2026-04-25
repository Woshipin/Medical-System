using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MedicalSystem.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization; // 【新增】引入 Authorize 命名空间

namespace MedicalSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly IConfiguration _configuration;

        public AuthController(UserManager<User> userManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _configuration = configuration;
        }

        // 病人注册：存入 Email 作为唯一账号名
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
                return Ok(ApiResponse<string>.SuccessResponse(null, "注册成功"));

            return BadRequest(ApiResponse<List<string>>.FailureResponse("注册失败", result.Errors.Select(e => e.Description).ToList()));
        }

        // Login 方法
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
                return Unauthorized(ApiResponse<string>.FailureResponse("账号或密码错误"));

            if (user.Role != UserRole.Patient)
                return Unauthorized(ApiResponse<string>.FailureResponse("请前往后台系统登录"));

            var token = GenerateJwtToken(user);
            
            return Ok(ApiResponse<object>.SuccessResponse(new { 
                token = token, 
                user = new { 
                    id = user.Id,
                    fullName = user.FullName,
                    email = user.Email,
                    roleValue = (int)user.Role // 顺便把 roleValue 传给前端，防止 Header 显示出错
                } 
            }));
        }

        // 【新增】：前端探测接口，用于判断账号是否还在数据库里存活
        [HttpGet("me")]
        [Authorize] // 因为 Program.cs 已经写了查库拦截器，所以走到这说明人一定还在
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

    public class FrontendRegisterDto {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string PhoneNumber { get; set; } = null!;
        public int GenderId { get; set; }
    }
    public class LoginDto { public string Email { get; set; } = null!; public string Password { get; set; } = null!; }
}