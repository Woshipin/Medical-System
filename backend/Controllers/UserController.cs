using System; 
using System.Collections.Generic; 
using System.Linq; 
using System.Threading.Tasks; 
using Microsoft.AspNetCore.Authorization; 
using Microsoft.AspNetCore.Identity; 
using Microsoft.AspNetCore.Mvc; 
using Microsoft.EntityFrameworkCore; 
using MedicalSystem.Models; 
using MedicalSystem.Services; 

namespace MedicalSystem.Controllers 
{
    [Route("api/[controller]")] 
    [ApiController] 
    public class UserController : ControllerBase 
    {
        private readonly UserManager<User> _userManager; 
        private readonly IActivityLogService _activityLog; 

        public UserController(UserManager<User> userManager, IActivityLogService activityLog) 
        {
            _userManager = userManager; 
            _activityLog = activityLog; 
        }

        [HttpGet] 
        public async Task<IActionResult> GetAll() 
        {
            var users = await _userManager.Users 
                .Include(u => u.Gender) 
                .Where(u => u.Role != UserRole.Doctor) 
                .OrderByDescending(u => u.CreatedAt) 
                .ToListAsync(); 

            return Ok(ApiResponse<IEnumerable<User>>.SuccessResponse(users)); 
        }

        [HttpPost] 
        public async Task<IActionResult> Create([FromBody] UserCreateDto model) 
        {
            if (!ModelState.IsValid) return BadRequest(ApiResponse<string>.FailureResponse("提交的数据有误")); 

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

            var result = await _userManager.CreateAsync(newUser, model.Password); 

            if (result.Succeeded) 
            {
                await _activityLog.LogAsync("Created", $"Created new User account:\n• User ID -> {newUser.Id}\n• Full Name -> {newUser.FullName}\n• Email -> {newUser.Email}\n• Phone -> {newUser.PhoneNumber ?? "None"}\n• Gender ID -> {newUser.GenderId}\n• Role -> {newUser.Role}\n• Status -> {(newUser.IsActive ? "Active" : "Inactive")}");

                return Ok(ApiResponse<User>.SuccessResponse(newUser, "用户创建成功")); 
            }

            var errors = string.Join(", ", result.Errors.Select(e => e.Description)); 
            return BadRequest(ApiResponse<string>.FailureResponse($"创建失败: {errors}")); 
        }

        [HttpPut("{id}")] 
        public async Task<IActionResult> Update(int id, [FromBody] UserUpdateDto model) 
        {
            var user = await _userManager.FindByIdAsync(id.ToString()); 
            if (user == null) return NotFound(ApiResponse<string>.FailureResponse("未找到用户")); 

            var changes = new List<string>(); 
            if (user.FullName != model.FullName) changes.Add($"• Full Name -> {user.FullName} ➔ {model.FullName}"); 
            if (user.Email != model.Email) changes.Add($"• Email -> {user.Email} ➔ {model.Email}"); 
            if (user.PhoneNumber != model.PhoneNumber) changes.Add($"• Phone -> {user.PhoneNumber ?? "None"} ➔ {model.PhoneNumber ?? "None"}"); 
            if (user.GenderId != model.GenderId) changes.Add($"• Gender ID -> {user.GenderId} ➔ {model.GenderId}"); 
            if (user.Role != model.Role) changes.Add($"• Role -> {user.Role} ➔ {model.Role}"); 
            if (user.IsActive != model.IsActive) changes.Add($"• Status -> {(user.IsActive ? "Active" : "Inactive")} ➔ {(model.IsActive ? "Active" : "Inactive")}"); 

            user.FullName = model.FullName; 
            user.Email = model.Email; 
            user.UserName = model.Email; 
            user.PhoneNumber = model.PhoneNumber; 
            user.GenderId = model.GenderId; 
            user.Role = model.Role; 
            user.IsActive = model.IsActive; 
            user.UpdatedAt = DateTime.Now; 

            var result = await _userManager.UpdateAsync(user); 
            if (result.Succeeded) 
            {
                string logDetails = changes.Any() 
                    ? $"Updated user details (ID: {id}):\n{string.Join("\n", changes)}" 
                    : $"Updated user details (ID: {id}):\n• No fields were modified."; 

                await _activityLog.LogAsync("Updated", logDetails); 

                return Ok(ApiResponse<string>.SuccessResponse(null, "更新成功")); 
            }
            
            return BadRequest(ApiResponse<string>.FailureResponse("更新失败")); 
        }

        [HttpDelete("{id}")] 
        public async Task<IActionResult> Delete(int id) 
        {
            var user = await _userManager.FindByIdAsync(id.ToString()); 
            if (user == null) return NotFound(ApiResponse<string>.FailureResponse("未找到用户")); 

            var result = await _userManager.DeleteAsync(user); 
            if (result.Succeeded) 
            {
                await _activityLog.LogAsync("Deleted", $"Deleted User account:\n• User ID -> {user.Id}\n• Full Name -> {user.FullName}\n• Email -> {user.Email}\n• Phone -> {user.PhoneNumber ?? "None"}\n• Role -> {user.Role}\n• Status -> {(user.IsActive ? "Active" : "Inactive")}");

                return Ok(ApiResponse<string>.SuccessResponse(null, "删除成功")); 
            }
            
            return BadRequest(ApiResponse<string>.FailureResponse("删除失败")); 
        }
    }

    // ==========================================
    // 【修复新增】：在此补全缺失的 DTO 类定义
    // ==========================================
    public class UserCreateDto 
    {
        public string FullName { get; set; } = null!; 
        public string Email { get; set; } = null!; 
        public string Password { get; set; } = null!; 
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