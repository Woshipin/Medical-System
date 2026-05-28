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
            if (!ModelState.IsValid) return BadRequest(ApiResponse<string>.FailureResponse("操作失败")); 

            var existingUser = await _userManager.FindByEmailAsync(model.Email); 
            if (existingUser != null) return BadRequest(ApiResponse<string>.FailureResponse("操作失败")); 

            var newUser = new User 
            {
                UserName = model.Email, 
                Email = model.Email, 
                FullName = model.FullName, 
                PhoneNumber = model.PhoneNumber, 
                GenderId = model.GenderId, 
                Role = model.Role, 
                Status = model.Status, 
                CreatedAt = DateTime.Now, 
                UpdatedAt = DateTime.Now 
            };

            var result = await _userManager.CreateAsync(newUser, model.Password); 

            if (result.Succeeded) 
            {
                // 銆愪慨鏀广€戯細绯荤粺瀹¤鏃ュ織涓 status 鐨勬暣鍨嬪鐞嗛€昏緫 (newUser.Status == 1)
                await _activityLog.LogAsync("Created", $"Created new User account:\n鈥?User ID -> {newUser.Id}\n鈥?Full Name -> {newUser.FullName}\n鈥?Email -> {newUser.Email}\n鈥?Phone -> {newUser.PhoneNumber ?? "None"}\n鈥?Gender ID -> {newUser.GenderId}\n鈥?Role -> {newUser.Role}\n鈥?Status -> {(newUser.Status == 1 ? "Active" : "Inactive")}");

                return Ok(ApiResponse<User>.SuccessResponse(newUser, "鐢ㄦ埛鍒涘缓鎴愬姛")); 
            }

            var errors = string.Join(", ", result.Errors.Select(e => e.Description)); 
            return BadRequest(ApiResponse<string>.FailureResponse($"鍒涘缓澶辫触: {errors}")); 
        }

        [HttpPut("{id}")] 
        public async Task<IActionResult> Update(int id, [FromBody] UserUpdateDto model) 
        {
            var user = await _userManager.FindByIdAsync(id.ToString()); 
            if (user == null) return NotFound(ApiResponse<string>.FailureResponse("操作失败")); 

            var changes = new List<string>(); 
            if (user.FullName != model.FullName) changes.Add($"鈥?Full Name -> {user.FullName} 鉃?{model.FullName}"); 
            if (user.Email != model.Email) changes.Add($"鈥?Email -> {user.Email} 鉃?{model.Email}"); 
            if (user.PhoneNumber != model.PhoneNumber) changes.Add($"鈥?Phone -> {user.PhoneNumber ?? "None"} 鉃?{model.PhoneNumber ?? "None"}"); 
            if (user.GenderId != model.GenderId) changes.Add($"鈥?Gender ID -> {user.GenderId} 鉃?{model.GenderId}"); 
            if (user.Role != model.Role) changes.Add($"鈥?Role -> {user.Role} 鉃?{model.Role}"); 
            
            // 銆愪慨鏀广€戯細淇敼姣斿鏃ュ織閫昏緫锛屼互鏁村瀷鐘舵€?(user.Status == 1) 褰㈠紡杈撳嚭
            if (user.Status != model.Status) changes.Add($"鈥?Status -> {(user.Status == 1 ? "Active" : "Inactive")} 鉃?{(model.Status == 1 ? "Active" : "Inactive")}"); 

            user.FullName = model.FullName; 
            user.Email = model.Email; 
            user.UserName = model.Email; 
            user.PhoneNumber = model.PhoneNumber; 
            user.GenderId = model.GenderId; 
            user.Role = model.Role; 
            user.Status = model.Status; 
            user.UpdatedAt = DateTime.Now; 

            var result = await _userManager.UpdateAsync(user); 
            if (result.Succeeded) 
            {
                string logDetails = changes.Any() 
                    ? $"Updated user details (ID: {id}):\n{string.Join("\n", changes)}" 
                    : $"Updated user details (ID: {id}):\n鈥?No fields were modified."; 

                await _activityLog.LogAsync("Updated", logDetails); 

                return Ok(ApiResponse<string>.SuccessResponse(null, "鏇存柊鎴愬姛")); 
            }
            
            return BadRequest(ApiResponse<string>.FailureResponse("鏇存柊澶辫触")); 
        }

        [HttpDelete("{id}")] 
        public async Task<IActionResult> Delete(int id) 
        {
            var user = await _userManager.FindByIdAsync(id.ToString()); 
            if (user == null) return NotFound(ApiResponse<string>.FailureResponse("操作失败")); 

            var result = await _userManager.DeleteAsync(user); 
            if (result.Succeeded) 
            {
                // 銆愪慨鏀广€戯細鏃ュ織涓姸鎬佸€间慨鏀逛负鏁村瀷澶勭悊鍒ゅ畾 (user.Status == 1)
                await _activityLog.LogAsync("Deleted", $"Deleted User account:\n鈥?User ID -> {user.Id}\n鈥?Full Name -> {user.FullName}\n鈥?Email -> {user.Email}\n鈥?Phone -> {user.PhoneNumber ?? "None"}\n鈥?Role -> {user.Role}\n鈥?Status -> {(user.Status == 1 ? "Active" : "Inactive")}");

                return Ok(ApiResponse<string>.SuccessResponse(null, "鍒犻櫎鎴愬姛")); 
            }
            
            return BadRequest(ApiResponse<string>.FailureResponse("鍒犻櫎澶辫触")); 
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
        // 銆愪慨鏀广€戯細甯冨皵鍊肩被鍨嬪彉鏇翠负鏁村瀷鐘舵€佺被鍨嬶紙0: 绂佺敤, 1: 鍚敤锛?
        public int Status { get; set; } = 1; 
    }

    public class UserUpdateDto 
    {
        public string FullName { get; set; } = null!; 
        public string Email { get; set; } = null!; 
        public string? PhoneNumber { get; set; } 
        public int GenderId { get; set; } 
        public UserRole Role { get; set; } 
        // 銆愪慨鏀广€戯細甯冨皵鍊肩被鍨嬪彉鏇翠负鏁村瀷鐘舵€佺被鍨嬶紙0: 绂佺敤, 1: 鍚敤锛?
        public int Status { get; set; } 
    }
}


