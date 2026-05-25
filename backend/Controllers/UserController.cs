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
                .Include(u => u.gender) 
                .Where(u => u.role != UserRole.Doctor) 
                .OrderByDescending(u => u.created_at) 
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
                full_name = model.FullName, 
                PhoneNumber = model.PhoneNumber, 
                gender_id = model.GenderId, 
                role = model.Role, 
                status = model.Status, 
                created_at = DateTime.Now, 
                updated_at = DateTime.Now 
            };

            var result = await _userManager.CreateAsync(newUser, model.Password); 

            if (result.Succeeded) 
            {
                await _activityLog.LogAsync("Created", $"Created new User account:\n• User ID -> {newUser.Id}\n• Full Name -> {newUser.full_name}\n• Email -> {newUser.Email}\n• Phone -> {newUser.PhoneNumber ?? "None"}\n• Gender ID -> {newUser.gender_id}\n• Role -> {newUser.role}\n• Status -> {(newUser.status == true ? "Active" : "Inactive")}");

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
            if (user.full_name != model.FullName) changes.Add($"• Full Name -> {user.full_name} ➔ {model.FullName}"); 
            if (user.Email != model.Email) changes.Add($"• Email -> {user.Email} ➔ {model.Email}"); 
            if (user.PhoneNumber != model.PhoneNumber) changes.Add($"• Phone -> {user.PhoneNumber ?? "None"} ➔ {model.PhoneNumber ?? "None"}"); 
            if (user.gender_id != model.GenderId) changes.Add($"• Gender ID -> {user.gender_id} ➔ {model.GenderId}"); 
            if (user.role != model.Role) changes.Add($"• Role -> {user.role} ➔ {model.Role}"); 
            if (user.status != model.Status) changes.Add($"• Status -> {(user.status == true ? "Active" : "Inactive")} ➔ {(model.Status ? "Active" : "Inactive")}"); 

            user.full_name = model.FullName; 
            user.Email = model.Email; 
            user.UserName = model.Email; 
            user.PhoneNumber = model.PhoneNumber; 
            user.gender_id = model.GenderId; 
            user.role = model.Role; 
            user.status = model.Status; 
            user.updated_at = DateTime.Now; 

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
                await _activityLog.LogAsync("Deleted", $"Deleted User account:\n• User ID -> {user.Id}\n• Full Name -> {user.full_name}\n• Email -> {user.Email}\n• Phone -> {user.PhoneNumber ?? "None"}\n• Role -> {user.role}\n• Status -> {(user.status == true ? "Active" : "Inactive")}");

                return Ok(ApiResponse<string>.SuccessResponse(null, "删除成功")); 
            }
            
            return BadRequest(ApiResponse<string>.FailureResponse("删除失败")); 
        }
    }

    public class UserCreateDto 
    {
        public string FullName { get; set; } = null!; 
        public string Email { get; set; } = null!; 
        public string Password { get; set; } = null!; 
        public string? PhoneNumber { get; set; } 
        public int GenderId { get; set; } 
        public UserRole Role { get; set; } 
        public bool Status { get; set; } = true; // 【修改】：IsActive 变更为 Status
    }

    public class UserUpdateDto 
    {
        public string FullName { get; set; } = null!; 
        public string Email { get; set; } = null!; 
        public string? PhoneNumber { get; set; } 
        public int GenderId { get; set; } 
        public UserRole Role { get; set; } 
        public bool Status { get; set; } // 【修改】：IsActive 变更为 Status
    }
}