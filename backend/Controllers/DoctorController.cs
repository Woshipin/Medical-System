using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MedicalSystem.Data;
using MedicalSystem.Models;

namespace MedicalSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DoctorsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public DoctorsController(AppDbContext context) { _context = context; }

        // 获取医生列表 (联表查询：Doctor + User + Gender)
        [HttpGet]
        public async Task<IActionResult> GetDoctors()
        {
            var doctors = await _context.Doctors
                .Include(d => d.User)
                    .ThenInclude(u => u.Gender)
                .ToListAsync();

            return Ok(ApiResponse<IEnumerable<Doctor>>.SuccessResponse(doctors));
        }

        // 更新医生及关联的用户账号信息
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DoctorUpdateDto input)
        {
            // 包含 User 导航属性进行同步更新
            var doctor = await _context.Doctors.Include(d => d.User).FirstOrDefaultAsync(d => d.Id == id);
            if (doctor == null || doctor.User == null) return NotFound(ApiResponse<string>.FailureResponse("未找到该医生记录"));

            // 1. 更新 User 表的数据
            doctor.User.FullName = input.FullName;
            doctor.User.GenderId = input.GenderId;
            doctor.User.Email = input.Email ?? doctor.User.Email;
            doctor.User.PhoneNumber = input.Phone;
            doctor.User.IsActive = input.IsActive;

            // 2. 更新 Doctor 表的数据
            doctor.LicenseNumber = input.LicenseNumber;
            doctor.Specialty = input.Specialty;
            doctor.Title = input.Title;
            doctor.Department = input.Department;
            doctor.OfficeLocation = input.OfficeLocation;
            doctor.YearsOfExperience = input.YearsOfExperience;
            doctor.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.SuccessResponse(null, "医生信息及账号资料更新成功"));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var doctor = await _context.Doctors.FindAsync(id);
            if (doctor == null) return NotFound(ApiResponse<object>.FailureResponse("记录不存在"));

            _context.Doctors.Remove(doctor);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null, "医生记录已成功移除"));
        }
    }

    public class DoctorUpdateDto {
        public string FullName { get; set; } = null!;
        public int GenderId { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public bool IsActive { get; set; }
        public string LicenseNumber { get; set; } = null!;
        public string Specialty { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string Department { get; set; } = null!;
        public string? OfficeLocation { get; set; }
        public int YearsOfExperience { get; set; }
    }
}