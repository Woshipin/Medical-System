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
    [Route("api/[controller]")] // 路由即为 api/admin
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

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] AdminRegisterDto model)
        {
            // 1. 验证角色并转换 (将前端传来的 "superadmin", "admin", "doctor" 转换为枚举)
            if (!Enum.TryParse<UserRole>(model.Role, true, out var userRole) || userRole == UserRole.Patient)
            {
                return BadRequest(ApiResponse<string>.FailureResponse("无效的系统角色"));
            }

            // 2. 验证用户是否已存在
            var userExists = await _userManager.FindByEmailAsync(model.Email);
            if (userExists != null)
                return BadRequest(ApiResponse<string>.FailureResponse("该邮箱已被注册"));

            // 3. 构建用户实体
            var user = new User
            {
                UserName = model.Email,
                Email = model.Email,
                FullName = model.FullName,
                Role = userRole, 
                IsActive = true,
                CreatedAt = DateTime.Now,
                
                // 【注意】因为 User 模型中 GenderId 是 [Required] 必填项，
                // 但你的 Dashboard 前端并没有提供选择性别的字段。
                // 解决方案：这里暂时赋一个默认值 (比如 1 代表未知/默认)。
                // 建议：确保你的 Gender 数据库表里存在 Id = 1 的记录，否则外键会报错！
                GenderId = 1 
            };

            // 注：如果是注册 Doctor，这里仅仅创建 User 表账号。
            // 因为真正的 Doctor 表需要执业证号等严格字段，应在他们首次登录 Dashboard 后通过 "完善资料" 页面单独填写。

            // 4. 保存到数据库
            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
                return Ok(ApiResponse<string>.SuccessResponse(null, "后台账号创建成功"));

            // 5. 失败处理
            var errorList = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(ApiResponse<List<string>>.FailureResponse("注册失败", errorList));
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AdminLoginDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
                return Unauthorized(ApiResponse<string>.FailureResponse("账号或密码错误"));

            if (!user.IsActive)
                return BadRequest(ApiResponse<string>.FailureResponse("账号已被禁用"));

            // 【核心安全拦截】阻止普通 Patient 登录 Dashboard ！！！
            if (user.Role == UserRole.Patient)
            {
                return Unauthorized(ApiResponse<string>.FailureResponse("权限不足：普通用户无法访问后台控制台"));
            }

            var token = GenerateJwtToken(user);

            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                token,
                user = new 
                { 
                    user.Id, 
                    user.FullName, 
                    role = user.Role.ToString().ToLower(), // 传回小写给前端: "superadmin", "admin", "doctor"
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

    #region Admin DTOs
    // 专门为 Dashboard 注册设计的 DTO
    public class AdminRegisterDto
    {
        [Required, EmailAddress]
        public string Email { get; set; } = null!;

        [Required, StringLength(100, MinimumLength = 8)]
        public string Password { get; set; } = null!;

        [Required]
        public string FullName { get; set; } = null!;

        [Required]
        public string Role { get; set; } = null!; // 接收前端的 "superadmin", "admin", "doctor"
    }

    // 专门为 Dashboard 登录设计的 DTO
    public class AdminLoginDto
    { 
        [Required] public string Email { get; set; } = null!;
        [Required] public string Password { get; set; } = null!;
    }
    #endregion
}