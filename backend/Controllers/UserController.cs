using MedicalSystem.Data; // 修正引用
using MedicalSystem.Models; // 修正引用
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedicalSystem.Controllers // 修正命名空间
{
    [Authorize(Roles = "SuperAdmin, Admin")]
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly AppDbContext _context; // 修正：类名改为 AppDbContext

        public UserController(UserManager<User> userManager, AppDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userManager.Users.OrderByDescending(u => u.CreatedAt).ToListAsync();
            return Ok(ApiResponse<IEnumerable<User>>.SuccessResponse(users));
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] UserManagementDto model)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try {
                var user = new User {
                    UserName = model.Email,
                    Email = model.Email,
                    FullName = model.FullName,
                    GenderId = model.GenderId,
                    Role = model.Role,
                    IsActive = true,
                    CreatedAt = DateTime.Now
                };

                var result = await _userManager.CreateAsync(user, model.Password);
                if (!result.Succeeded) return BadRequest(ApiResponse<string>.FailureResponse("创建失败"));

                if (model.Role == UserRole.Doctor) {
                    var doctor = new Doctor { 
                        UserId = user.Id, 
                        LicenseNumber = "PENDING",
                        Specialty = "General",
                        Title = "Physician",
                        Department = "Outpatient"
                    };
                    _context.Doctors.Add(doctor);
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();
                return Ok(ApiResponse<string>.SuccessResponse(null, "用户创建成功"));
            }
            catch (Exception) {
                await transaction.RollbackAsync();
                return StatusCode(500, ApiResponse<string>.FailureResponse("系统错误"));
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UserUpdateDto model)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound(ApiResponse<string>.FailureResponse("用户不存在"));

            user.FullName = model.FullName;
            user.IsActive = model.IsActive;
            user.GenderId = model.GenderId;

            var result = await _userManager.UpdateAsync(user);
            if (result.Succeeded) return Ok(ApiResponse<string>.SuccessResponse(null, "更新成功"));
            return BadRequest(ApiResponse<string>.FailureResponse("更新失败"));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound(ApiResponse<string>.FailureResponse("用户不存在"));

            var result = await _userManager.DeleteAsync(user);
            if (result.Succeeded) return Ok(ApiResponse<string>.SuccessResponse(null, "删除成功"));
            return BadRequest(ApiResponse<string>.FailureResponse("删除失败"));
        }
    }

    public class UserManagementDto { 
        public string Email { get; set; } = null!; 
        public string Password { get; set; } = null!; 
        public string FullName { get; set; } = null!; 
        public int GenderId { get; set; } 
        public UserRole Role { get; set; } 
    }

    public class UserUpdateDto { 
        public string FullName { get; set; } = null!; 
        public bool IsActive { get; set; } 
        public int GenderId { get; set; } 
    }
}