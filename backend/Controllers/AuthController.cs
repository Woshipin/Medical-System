using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MedicalSystem.Models; 
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.ComponentModel.DataAnnotations;

namespace MedicalSystem.Controllers
{
    [Route("api/[controller]")] // 路由即为 api/auth
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

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] FrontendRegisterDto model)
        {
            var userExists = await _userManager.FindByEmailAsync(model.Email);
            if (userExists != null)
                return BadRequest(ApiResponse<string>.FailureResponse("该邮箱已被占用"));

            var user = new User
            {
                UserName = model.Email,
                Email = model.Email,
                FullName = model.FullName,
                GenderId = model.GenderId, 
                Role = UserRole.Patient, // 【强制】前台注册的一律为 Patient
                IsActive = true,
                CreatedAt = DateTime.Now
            };

            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
                return Ok(ApiResponse<string>.SuccessResponse(null, "注册成功"));

            var errorList = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(ApiResponse<List<string>>.FailureResponse("注册失败", errorList));
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] FrontendLoginDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
                return Unauthorized(ApiResponse<string>.FailureResponse("账号或密码错误"));

            if (!user.IsActive)
                return BadRequest(ApiResponse<string>.FailureResponse("账号已被禁用"));

            // 【安全拦截】拦截管理员跑到前台去登录
            if (user.Role != UserRole.Patient)
            {
                return Unauthorized(ApiResponse<string>.FailureResponse("请前往后台管理系统登录"));
            }

            var token = GenerateJwtToken(user);

            return Ok(ApiResponse<object>.SuccessResponse(new 
            {
                token,
                user = new { 
                    user.Id, 
                    user.FullName, 
                    roleValue = (int)user.Role 
                }
            }, "登录成功"));
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email!),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("roleValue", ((int)user.Role).ToString())
            };

            var creds = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    #region Frontend DTOs
    // 专门为前台设计的注册 DTO (去除了 Role 和 DoctorProfile)
    public class FrontendRegisterDto 
    {
        [Required, EmailAddress]
        public string Email { get; set; } = null!;

        [Required, StringLength(100, MinimumLength = 6)]
        public string Password { get; set; } = null!;

        [Required]
        public string FullName { get; set; } = null!;

        [Required]
        public int GenderId { get; set; } 
    }

    public class FrontendLoginDto 
    { 
        [Required] public string Email { get; set; } = null!;
        [Required] public string Password { get; set; } = null!;
    }
    #endregion
}