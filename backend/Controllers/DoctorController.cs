using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MedicalSystem.Data;
using MedicalSystem.Models;
using Microsoft.AspNetCore.Identity;

namespace MedicalSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DoctorsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<User> _userManager;

        public DoctorsController(AppDbContext context, UserManager<User> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // 1. 获取所有医生列表
        [HttpGet]
        public async Task<IActionResult> GetDoctors()
        {
            var doctors = await _context.Doctors
                .Include(d => d.User)
                    .ThenInclude(u => u.Gender)
                .ToListAsync();

            // 格式化输出，方便前端读取
            var result = doctors.Select(d => new
            {
                d.Id,
                d.UserId,
                d.LicenseNumber,
                d.Specialty,
                d.Title,
                d.Department,
                DateOfBirth = d.DateOfBirth.ToString("yyyy-MM-dd"),
                d.OfficeLocation,
                d.YearsOfExperience,
                User = new
                {
                    d.User.Id,
                    d.User.FullName,
                    d.User.Email,
                    d.User.PhoneNumber,
                    d.User.GenderId,
                    d.User.Role,
                    d.User.IsActive,
                    Gender = d.User.Gender != null ? new { d.User.Gender.Id, d.User.Gender.Name } : null
                }
            });

            return Ok(new { data = result, message = "Success" });
        }

        // 2. 创建医生及用户账号
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] DoctorCreateUpdateDto input)
        {
            // 检查邮箱是否已存在
            var existingUser = await _userManager.FindByEmailAsync(input.Email);
            if (existingUser != null)
            {
                // 返回与前端 fieldErrors 匹配的格式
                return BadRequest(new { 
                    message = "Validation failed.", 
                    errors = new { email = new[] { "This email address is already registered." } } 
                });
            }

            var user = new User
            {
                UserName = input.Email,
                Email = input.Email,
                FullName = input.FullName,
                PhoneNumber = input.Phone,
                GenderId = input.GenderId,
                Role = UserRole.Doctor,
                IsActive = input.IsActive,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            var result = await _userManager.CreateAsync(user, input.Password);
            if (!result.Succeeded)
            {
                // 尝试捕获 Identity 的具体错误（如密码不合规等）并转换为字段错误
                var errorDict = new Dictionary<string, string[]>();
                foreach (var err in result.Errors)
                {
                    if (err.Code.Contains("Password")) errorDict["password"] = new[] { err.Description };
                    else if (err.Code.Contains("Email")) errorDict["email"] = new[] { err.Description };
                    else errorDict["general"] = new[] { err.Description };
                }
                return BadRequest(new { message = "Failed to create user.", errors = errorDict });
            }

            var doctor = new Doctor
            {
                UserId = user.Id,
                LicenseNumber = input.LicenseNumber,
                Specialty = input.Specialty,
                Title = input.Title,
                Department = input.Department,
                DateOfBirth = DateOnly.Parse(input.DateOfBirth),
                OfficeLocation = input.OfficeLocation,
                YearsOfExperience = input.YearsOfExperience,
                UpdatedAt = DateTime.Now
            };

            _context.Doctors.Add(doctor);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Doctor successfully created." });
        }

                // 3. 更新医生及关联用户
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DoctorCreateUpdateDto input)
        {
            var doctor = await _context.Doctors.Include(d => d.User).FirstOrDefaultAsync(d => d.Id == id);
            if (doctor == null || doctor.User == null) 
                return NotFound(new { message = "Doctor not found." });

            // 如果修改了邮箱，检查新邮箱是否被他人使用
            if (!string.IsNullOrWhiteSpace(input.Email) && input.Email != doctor.User.Email)
            {
                var existingUser = await _userManager.FindByEmailAsync(input.Email);
                if (existingUser != null && existingUser.Id != doctor.UserId)
                {
                    return BadRequest(new { 
                        message = "Validation failed.", 
                        errors = new { email = new[] { "This email address is already taken by another user." } } 
                    });
                }
                doctor.User.Email = input.Email;
                doctor.User.UserName = input.Email;
            }

            // 更新 User 数据
            doctor.User.FullName = input.FullName;
            doctor.User.GenderId = input.GenderId;
            doctor.User.PhoneNumber = input.Phone;
            doctor.User.IsActive = input.IsActive;

            var updateResult = await _userManager.UpdateAsync(doctor.User);
            if (!updateResult.Succeeded) return BadRequest(new { message = "Failed to update user." });

            if (!string.IsNullOrWhiteSpace(input.Password))
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(doctor.User);
                var pwdResult = await _userManager.ResetPasswordAsync(doctor.User, token, input.Password);
                if (!pwdResult.Succeeded) return BadRequest(new { message = "Failed to update password." });
            }

            // 更新 Doctor 数据
            doctor.LicenseNumber = input.LicenseNumber;
            doctor.Specialty = input.Specialty;
            doctor.Title = input.Title;
            doctor.Department = input.Department;
            doctor.DateOfBirth = DateOnly.Parse(input.DateOfBirth);
            doctor.OfficeLocation = input.OfficeLocation;
            doctor.YearsOfExperience = input.YearsOfExperience;
            doctor.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Doctor information updated." });
        }

        // 4. 删除医生（级联删除用户）
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var doctor = await _context.Doctors.Include(d => d.User).FirstOrDefaultAsync(d => d.Id == id);
            if (doctor == null) return NotFound(new { message = "Record not found." });

            // 删除 Identity User 会级联删除 Doctor（如果在数据库配置了级联），或者我们手动删除两者
            if (doctor.User != null)
            {
                await _userManager.DeleteAsync(doctor.User);
            }
            else
            {
                _context.Doctors.Remove(doctor);
                await _context.SaveChangesAsync();
            }
            
            return Ok(new { message = "Doctor record successfully deleted." });
        }
    }

    // 统一的 DTO 接收 Create 和 Update 的数据
    public class DoctorCreateUpdateDto
    {
        // User Info
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Password { get; set; } // Create 时必填，Update 时选填
        public string? Phone { get; set; }
        public int GenderId { get; set; }
        public bool IsActive { get; set; }

        // Doctor Info
        public string LicenseNumber { get; set; } = null!;
        public string Specialty { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string Department { get; set; } = null!;
        public string DateOfBirth { get; set; } = null!; // 格式 yyyy-MM-dd
        public string? OfficeLocation { get; set; }
        public int YearsOfExperience { get; set; }
    }
}