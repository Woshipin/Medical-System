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
using System.IO;

namespace MedicalSystem.Controllers 
{
    [Route("api/[controller]")] 
    [ApiController] 
    public class StaffController : ControllerBase 
    {
        private readonly UserManager<User> _userManager; 
        private readonly IActivityLogService _activityLog; 

        public StaffController(UserManager<User> userManager, IActivityLogService activityLog) 
        {
            _userManager = userManager; 
            _activityLog = activityLog; 
        }

        // 新增：安全保存 Base64 编码的图片至本地 user-image 文件夹的方法
        private string? SaveBase64Image(string? base64Data)
        {
            if (string.IsNullOrEmpty(base64Data)) return null;

            // 检测是否为 Base64 Data URI 格式
            if (base64Data.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    var commaIndex = base64Data.IndexOf(',');
                    if (commaIndex == -1) return base64Data;

                    // 提取图片后缀名
                    var header = base64Data.Substring(0, commaIndex);
                    var extension = ".jpg"; 
                    if (header.Contains("png", StringComparison.OrdinalIgnoreCase)) extension = ".png";
                    else if (header.Contains("gif", StringComparison.OrdinalIgnoreCase)) extension = ".gif";
                    else if (header.Contains("webp", StringComparison.OrdinalIgnoreCase)) extension = ".webp";
                    else if (header.Contains("jpeg", StringComparison.OrdinalIgnoreCase)) extension = ".jpeg";

                    var base64Content = base64Data.Substring(commaIndex + 1);
                    var imageBytes = Convert.FromBase64String(base64Content);

                    // 确定并创建保存目录 "user-image"
                    var targetFolder = Path.Combine(Directory.GetCurrentDirectory(), "user-image");
                    if (!Directory.Exists(targetFolder))
                    {
                        Directory.CreateDirectory(targetFolder);
                    }

                    // 使用唯一标识符 GUID 命名防止冲突
                    var fileName = $"{Guid.NewGuid()}{extension}";
                    var filePath = Path.Combine(targetFolder, fileName);
                    System.IO.File.WriteAllBytes(filePath, imageBytes);

                    // 返回相对路径供前端访问
                    return $"/user-image/{fileName}";
                }
                catch
                {
                    // 转换失败时降级返回原始数据
                    return base64Data;
                }
            }

            return base64Data; 
        }

        [HttpGet] 
        public async Task<IActionResult> GetAll() 
        {
            // 仅提取 SuperAdmin (0) 和 Admin (1) 的用户
            var staffs = await _userManager.Users 
                .Include(u => u.Gender) 
                .Where(u => u.Role == UserRole.SuperAdmin || u.Role == UserRole.Admin) 
                .OrderByDescending(u => u.CreatedAt) 
                .ToListAsync(); 

            return Ok(ApiResponse<IEnumerable<User>>.SuccessResponse(staffs, "Staff list retrieved successfully.")); 
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var staff = await _userManager.Users
                .Include(u => u.Gender)
                .FirstOrDefaultAsync(u => u.Id == id && (u.Role == UserRole.SuperAdmin || u.Role == UserRole.Admin));
            
            if (staff == null) 
                return NotFound(ApiResponse<string>.FailureResponse("Staff not found."));

            return Ok(ApiResponse<User>.SuccessResponse(staff, "Staff details retrieved successfully."));
        }

        [HttpPost] 
        public async Task<IActionResult> Create([FromBody] StaffDto model) 
        {
            if (!ModelState.IsValid) 
                return BadRequest(ApiResponse<string>.FailureResponse("Invalid data provided.")); 

            var existingUser = await _userManager.FindByEmailAsync(model.Email); 
            if (existingUser != null) 
                return BadRequest(ApiResponse<string>.FailureResponse("Email already exists.")); 

            // 限制只能创建 SuperAdmin 和 Admin 角色
            if (model.Role != UserRole.SuperAdmin && model.Role != UserRole.Admin)
            {
                return BadRequest(ApiResponse<string>.FailureResponse("Unauthorized role type assignment."));
            }

            // 保存本地图片并获取相对路径
            var savedImagePath = SaveBase64Image(model.ProfileImageUrl);

            var newStaff = new User 
            {
                UserName = model.Email, 
                Email = model.Email, 
                FullName = model.FullName, 
                ProfileImageUrl = savedImagePath, // 保存本地路径
                DateOfBirth = string.IsNullOrEmpty(model.DateOfBirth) ? null : DateOnly.Parse(model.DateOfBirth),
                PhoneNumber = model.PhoneNumber, 
                PhoneNumberAlt = model.PhoneNumberAlt,
                GenderId = model.GenderId, 
                AddressLine1 = model.AddressLine1,
                AddressLine2 = model.AddressLine2,
                City = model.City,
                State = model.State,
                PostalCode = model.PostalCode,
                Country = model.Country,
                Role = model.Role, 
                Status = model.Status, 
                CreatedAt = DateTime.UtcNow, 
                UpdatedAt = DateTime.UtcNow 
            };

            var result = await _userManager.CreateAsync(newStaff, model.Password ?? string.Empty); 

            if (result.Succeeded) 
            {
                await _activityLog.LogAsync("Created", $"Created new Staff account:\n• ID -> {newStaff.Id}\n• Name -> {newStaff.FullName}\n• Email -> {newStaff.Email}\n• Role -> {newStaff.Role}");
                return Ok(ApiResponse<User>.SuccessResponse(newStaff, "Staff created successfully.")); 
            }

            return BadRequest(ApiResponse<string>.FailureResponse(string.Join(", ", result.Errors.Select(e => e.Description)))); 
        }

        [HttpPut("{id}")] 
        public async Task<IActionResult> Update(int id, [FromBody] StaffDto model) 
        {
            var user = await _userManager.FindByIdAsync(id.ToString()); 
            if (user == null || (user.Role != UserRole.SuperAdmin && user.Role != UserRole.Admin)) 
                return NotFound(ApiResponse<string>.FailureResponse("Staff not found.")); 

            // 如果上传了新的 Base64 格式图片则重新保存
            if (!string.IsNullOrEmpty(model.ProfileImageUrl) && model.ProfileImageUrl != user.ProfileImageUrl)
            {
                user.ProfileImageUrl = SaveBase64Image(model.ProfileImageUrl);
            }

            user.FullName = model.FullName; 
            user.Email = model.Email; 
            user.UserName = model.Email; 
            user.DateOfBirth = string.IsNullOrEmpty(model.DateOfBirth) ? null : DateOnly.Parse(model.DateOfBirth);
            user.PhoneNumber = model.PhoneNumber; 
            user.PhoneNumberAlt = model.PhoneNumberAlt;
            user.GenderId = model.GenderId; 
            user.AddressLine1 = model.AddressLine1;
            user.AddressLine2 = model.AddressLine2;
            user.City = model.City;
            user.State = model.State;
            user.PostalCode = model.PostalCode;
            user.Country = model.Country;
            user.Role = model.Role; 
            user.Status = model.Status; 
            user.UpdatedAt = DateTime.UtcNow; 

            var result = await _userManager.UpdateAsync(user); 
            
            if (result.Succeeded && !string.IsNullOrEmpty(model.Password))
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                await _userManager.ResetPasswordAsync(user, token, model.Password);
            }

            if (result.Succeeded) 
            {
                await _activityLog.LogAsync("Updated", $"Updated Staff details (ID: {id}, Name: {user.FullName})"); 
                return Ok(ApiResponse<string>.SuccessResponse(null, "Staff updated successfully.")); 
            }
            
            return BadRequest(ApiResponse<string>.FailureResponse("Update failed.")); 
        }

        [HttpDelete("{id}")] 
        public async Task<IActionResult> Delete(int id) 
        {
            var user = await _userManager.FindByIdAsync(id.ToString()); 
            if (user == null || (user.Role != UserRole.SuperAdmin && user.Role != UserRole.Admin)) 
                return NotFound(ApiResponse<string>.FailureResponse("Staff not found.")); 

            var result = await _userManager.DeleteAsync(user); 
            if (result.Succeeded) 
            {
                await _activityLog.LogAsync("Deleted", $"Deleted Staff account:\n• ID -> {user.Id}\n• Name -> {user.FullName}");
                return Ok(ApiResponse<string>.SuccessResponse(null, "Staff deleted successfully.")); 
            }
            
            return BadRequest(ApiResponse<string>.FailureResponse("Delete failed.")); 
        }
    }

    public class StaffDto 
    {
        public string FullName { get; set; } = null!; 
        public string Email { get; set; } = null!; 
        public string? Password { get; set; } 
        public string? ProfileImageUrl { get; set; }
        public string? DateOfBirth { get; set; } 
        public string? PhoneNumber { get; set; } 
        public string? PhoneNumberAlt { get; set; } 
        public int? GenderId { get; set; } 
        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }
        public UserRole Role { get; set; } 
        public int Status { get; set; } = 1; 
    }
}