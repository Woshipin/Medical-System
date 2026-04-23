using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MedicalSystem.Models;

namespace MedicalSystem.Controllers
{
    // [Authorize(Roles = "SuperAdmin, Admin")] // 调试阶段如果遇到 401 报错，可以先注释掉这行
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly UserManager<User> _userManager;

        public UserController(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        // 1. 获取用户 (只包含 SuperAdmin, Admin, Patient)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            // 过滤掉 Doctor (Role = 2)，并且 Include 关联的 Gender
            var users = await _userManager.Users
                .Include(u => u.Gender)
                .Where(u => u.Role != UserRole.Doctor) // 核心需求：只获取 0, 1, 3
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            return Ok(ApiResponse<IEnumerable<User>>.SuccessResponse(users));
        }

        // 2. 创建用户 (Create) - 之前你缺少的代码
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] UserCreateDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ApiResponse<string>.FailureResponse("提交的数据有误"));

            // 检查邮箱是否重复
            var existingUser = await _userManager.FindByEmailAsync(model.Email);
            if (existingUser != null) return BadRequest(ApiResponse<string>.FailureResponse("该邮箱已被注册"));

            var newUser = new User
            {
                UserName = model.Email,
                Email = model.Email,
                FullName = model.FullName,
                PhoneNumber = model.PhoneNumber,
                GenderId = model.GenderId,
                Role = model.Role,
                IsActive = model.IsActive,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            // 使用 Identity 的 CreateAsync，它会自动对密码进行 Hash 处理
            var result = await _userManager.CreateAsync(newUser, model.Password);

            if (result.Succeeded)
            {
                return Ok(ApiResponse<User>.SuccessResponse(newUser, "用户创建成功"));
            }

            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return BadRequest(ApiResponse<string>.FailureResponse($"创建失败: {errors}"));
        }

        // 3. 修改用户信息 (Update)
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UserUpdateDto model)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null) return NotFound(ApiResponse<string>.FailureResponse("未找到用户"));

            user.FullName = model.FullName;
            user.Email = model.Email;
            user.UserName = model.Email; 
            user.PhoneNumber = model.PhoneNumber;
            user.GenderId = model.GenderId;
            user.Role = model.Role;
            user.IsActive = model.IsActive;
            user.UpdatedAt = DateTime.Now;

            var result = await _userManager.UpdateAsync(user);
            if (result.Succeeded) return Ok(ApiResponse<string>.SuccessResponse(null, "更新成功"));
            
            return BadRequest(ApiResponse<string>.FailureResponse("更新失败"));
        }

        // 4. 删除用户 (Delete)
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null) return NotFound(ApiResponse<string>.FailureResponse("未找到用户"));

            var result = await _userManager.DeleteAsync(user);
            if (result.Succeeded) return Ok(ApiResponse<string>.SuccessResponse(null, "删除成功"));
            
            return BadRequest(ApiResponse<string>.FailureResponse("删除失败"));
        }
    }

    // --- DTO 类定义 ---
    public class UserCreateDto 
    {
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!; // 新增必须传密码
        public string? PhoneNumber { get; set; } 
        public int GenderId { get; set; }
        public UserRole Role { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class UserUpdateDto 
    {
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? PhoneNumber { get; set; } 
        public int GenderId { get; set; }
        public UserRole Role { get; set; }
        public bool IsActive { get; set; }
    }
}