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

        // [GET] 获取医生列表：需要关联 User 表来拿姓名和性别
        [HttpGet]
        public async Task<IActionResult> GetDoctors()
        {
            var doctors = await _context.Doctors
                .Include(d => d.User) // 关联账号信息
                    .ThenInclude(u => u.Gender) // 关联性别名称
                .ToListAsync();

            return Ok(ApiResponse<IEnumerable<Doctor>>.SuccessResponse(doctors));
        }

        // 只展示修改过的 Update 方法部分，确保逻辑闭环
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DoctorUpdateDto input)
        {
            var doctor = await _context.Doctors.Include(d => d.User).FirstOrDefaultAsync(d => d.Id == id);
            if (doctor == null || doctor.User == null) return NotFound(ApiResponse<string>.FailureResponse("未找到该医生"));

            // 使用 doctor.User! 消除警告
            doctor.User!.FullName = input.FullName;
            doctor.User.GenderId = input.GenderId;
            doctor.User.Email = input.Email;
            doctor.User.PhoneNumber = input.Phone;
            doctor.User.IsActive = input.IsActive;

            doctor.LicenseNumber = input.LicenseNumber;
            doctor.Specialty = input.Specialty;
            doctor.Title = input.Title;
            doctor.Department = input.Department;
            doctor.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.SuccessResponse(null!, "医生信息更新成功"));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var doctor = await _context.Doctors.FindAsync(id);
            if (doctor == null) return NotFound(ApiResponse<object>.FailureResponse("记录不存在"));

            _context.Doctors.Remove(doctor);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null, "医生记录已删除"));
        }
    }

    // 专门用于接收更新请求的 DTO 类，解决字段分散在两个表的问题
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