using System; 
using System.Collections.Generic; 
using System.Linq; 
using System.Threading.Tasks; 
using Microsoft.AspNetCore.Mvc; 
using Microsoft.EntityFrameworkCore; 
using MedicalSystem.Data; 
using MedicalSystem.Models; 
using Microsoft.AspNetCore.Identity; 
using MedicalSystem.Services; 

namespace MedicalSystem.Controllers 
{
    [ApiController] 
    [Route("api/[controller]")] 
    public class DoctorsController : ControllerBase 
    {
        private readonly AppDbContext _context; 
        private readonly UserManager<User> _userManager; 
        private readonly IActivityLogService _activityLog; 

        public DoctorsController(AppDbContext context, UserManager<User> userManager, IActivityLogService activityLog) 
        {
            _context = context; 
            _userManager = userManager; 
            _activityLog = activityLog; 
        }

        [HttpGet] 
        public async Task<IActionResult> GetDoctors() 
        {
            var doctors = await _context.Doctors 
                .Include(d => d.user) 
                    .ThenInclude(u => u!.gender) 
                .ToListAsync(); 

            var result = doctors.Select(d => new 
            {
                d.id,
                d.user_id,
                d.license_number,
                d.specialty_id,
                d.title_id,
                d.department_id,
                DateOfBirth = d.date_of_birth.ToString("yyyy-MM-dd"),
                d.office_location_id,
                d.years_of_experience,
                d.address,
                d.postal_code,
                d.office_phone,
                DateJoin = d.date_join.ToString("yyyy-MM-dd"),
                DateLeft = d.date_left?.ToString("yyyy-MM-dd"),
                d.status,
                d.remark,
                User = d.user != null ? new
                {
                    d.user.Id,
                    d.user.full_name,
                    d.user.Email,
                    d.user.PhoneNumber,
                    d.user.gender_id,
                    d.user.role,
                    d.user.status,
                    Gender = d.user.gender != null ? new { d.user.gender.id, d.user.gender.name } : null
                } : null
            });

            return Ok(new { data = result, message = "Success" }); 
        }

        [HttpPost] 
        public async Task<IActionResult> Create([FromBody] DoctorCreateUpdateDto input) 
        {
            var existingUser = await _userManager.FindByEmailAsync(input.Email); 
            if (existingUser != null) 
            {
                return BadRequest(new { 
                    message = "Validation failed.", 
                    errors = new { email = new[] { "This email address is already registered." } } 
                });
            }

            var user = new User 
            {
                UserName = input.Email,
                Email = input.Email,
                full_name = input.FullName,
                PhoneNumber = input.Phone,
                gender_id = input.GenderId,
                role = UserRole.Doctor, 
                status = input.UserStatus,
                created_at = DateTime.Now,
                updated_at = DateTime.Now
            };

            var result = await _userManager.CreateAsync(user, input.Password ?? string.Empty); 
            if (!result.Succeeded) 
            {
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
                user_id = user.Id, 
                license_number = input.LicenseNumber,
                specialty_id = input.SpecialtyId,
                title_id = input.TitleId,
                department_id = input.DepartmentId,
                date_of_birth = DateOnly.Parse(input.DateOfBirth),
                office_location_id = input.OfficeLocationId,
                years_of_experience = input.YearsOfExperience,
                address = input.Address,
                postal_code = input.PostalCode,
                office_phone = input.OfficePhone,
                date_join = DateOnly.Parse(input.DateJoin),
                date_left = string.IsNullOrEmpty(input.DateLeft) ? null : DateOnly.Parse(input.DateLeft),
                status = input.DoctorStatus,
                remark = input.Remark,
                updated_at = DateTime.Now
            };

            _context.Doctors.Add(doctor); 
            await _context.SaveChangesAsync(); 

            await _activityLog.LogAsync("Created", $"Created new Doctor Profile & User account:\n• User ID -> {user.Id}\n• Full Name -> {user.full_name}\n• Email -> {user.Email}\n• Phone -> {user.PhoneNumber ?? "None"}\n• User Status -> {(user.status == true ? "Active" : "Inactive")}\n• License Number -> {doctor.license_number}\n• Specialty ID -> {doctor.specialty_id}\n• Department ID -> {doctor.department_id}\n• Doctor Status Code -> {doctor.status}");

            return Ok(new { message = "Doctor successfully created." }); 
        }

        [HttpPut("{id}")] 
        public async Task<IActionResult> Update(int id, [FromBody] DoctorCreateUpdateDto input) 
        {
            var doctor = await _context.Doctors.Include(d => d.user).FirstOrDefaultAsync(d => d.id == id); 
            if (doctor == null || doctor.user == null) 
                return NotFound(new { message = "Doctor not found." }); 

            var changes = new List<string>(); 
            if (doctor.user.full_name != input.FullName) changes.Add($"• Full Name -> {doctor.user.full_name} ➔ {input.FullName}"); 
            if (doctor.user.Email != input.Email) changes.Add($"• Email -> {doctor.user.Email} ➔ {input.Email}"); 
            if (doctor.user.PhoneNumber != input.Phone) changes.Add($"• Phone -> {doctor.user.PhoneNumber ?? "None"} ➔ {input.Phone ?? "None"}"); 
            if (doctor.user.gender_id != input.GenderId) changes.Add($"• Gender ID -> {doctor.user.gender_id} ➔ {input.GenderId}"); 
            if (doctor.user.status != input.UserStatus) changes.Add($"• User Status -> {(doctor.user.status == true ? "Active" : "Inactive")} ➔ {(input.UserStatus ? "Active" : "Inactive")}"); 

            if (doctor.license_number != input.LicenseNumber) changes.Add($"• License -> {doctor.license_number} ➔ {input.LicenseNumber}"); 
            if (doctor.specialty_id != input.SpecialtyId) changes.Add($"• Specialty ID -> {doctor.specialty_id} ➔ {input.SpecialtyId}"); 
            if (doctor.title_id != input.TitleId) changes.Add($"• Title ID -> {doctor.title_id} ➔ {input.TitleId}"); 
            if (doctor.department_id != input.DepartmentId) changes.Add($"• Department ID -> {doctor.department_id} ➔ {input.DepartmentId}"); 
            if (doctor.date_of_birth != DateOnly.Parse(input.DateOfBirth)) changes.Add($"• Date Of Birth -> {doctor.date_of_birth} ➔ {input.DateOfBirth}"); 
            if (doctor.office_location_id != input.OfficeLocationId) changes.Add($"• Office Location ID -> {doctor.office_location_id} ➔ {input.OfficeLocationId}"); 
            if (doctor.years_of_experience != input.YearsOfExperience) changes.Add($"• Experience Years -> {doctor.years_of_experience} ➔ {input.YearsOfExperience}"); 
            if (doctor.status != input.DoctorStatus) changes.Add($"• Doctor Status Code -> {doctor.status} ➔ {input.DoctorStatus}");

            if (!string.IsNullOrWhiteSpace(input.Email) && input.Email != doctor.user.Email)
            {
                var existingUser = await _userManager.FindByEmailAsync(input.Email); 
                if (existingUser != null && existingUser.Id != doctor.user_id) 
                {
                    return BadRequest(new { 
                        message = "Validation failed.", 
                        errors = new { email = new[] { "This email address is already taken by another user." } } 
                    });
                }
                doctor.user.Email = input.Email; 
                doctor.user.UserName = input.Email; 
            }

            doctor.user.full_name = input.FullName;
            doctor.user.gender_id = input.GenderId;
            doctor.user.PhoneNumber = input.Phone;
            doctor.user.status = input.UserStatus;

            var updateResult = await _userManager.UpdateAsync(doctor.user); 
            if (!updateResult.Succeeded) return BadRequest(new { message = "Failed to update user." }); 

            if (!string.IsNullOrWhiteSpace(input.Password)) 
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(doctor.user); 
                var pwdResult = await _userManager.ResetPasswordAsync(doctor.user, token, input.Password); 
                if (!pwdResult.Succeeded) return BadRequest(new { message = "Failed to update password." }); 
                changes.Add("• Password -> [Modified]"); 
            }

            doctor.license_number = input.LicenseNumber;
            doctor.specialty_id = input.SpecialtyId;
            doctor.title_id = input.TitleId;
            doctor.department_id = input.DepartmentId;
            doctor.date_of_birth = DateOnly.Parse(input.DateOfBirth);
            doctor.office_location_id = input.OfficeLocationId;
            doctor.years_of_experience = input.YearsOfExperience;
            doctor.address = input.Address;
            doctor.postal_code = input.PostalCode;
            doctor.office_phone = input.OfficePhone;
            doctor.date_join = DateOnly.Parse(input.DateJoin);
            doctor.date_left = string.IsNullOrEmpty(input.DateLeft) ? null : DateOnly.Parse(input.DateLeft);
            doctor.status = input.DoctorStatus;
            doctor.remark = input.Remark;
            doctor.updated_at = DateTime.Now; 

            await _context.SaveChangesAsync(); 

            string logDetails = changes.Any() 
                ? $"Updated Doctor profile (ID: {id}):\n{string.Join("\n", changes)}" 
                : $"Updated Doctor profile (ID: {id}):\n• No fields were modified."; 
            
            await _activityLog.LogAsync("Updated", logDetails); 

            return Ok(new { message = "Doctor information updated." }); 
        }

        [HttpDelete("{id}")] 
        public async Task<IActionResult> Delete(int id) 
        {
            var doctor = await _context.Doctors.Include(d => d.user).FirstOrDefaultAsync(d => d.id == id); 
            if (doctor == null) return NotFound(new { message = "Record not found." }); 

            string userEmail = doctor.user?.Email ?? "None"; 
            string fullName = doctor.user?.full_name ?? "None"; 
            string userPhone = doctor.user?.PhoneNumber ?? "None"; 
            string license = doctor.license_number;
            int dept = doctor.department_id;
            string dob = doctor.date_of_birth.ToString();

            if (doctor.user != null) 
            {
                await _userManager.DeleteAsync(doctor.user); 
            }
            else 
            {
                _context.Doctors.Remove(doctor); 
                await _context.SaveChangesAsync(); 
            }

            await _activityLog.LogAsync("Deleted", $"Deleted Doctor profile & associated User account:\n• Doctor ID -> {id}\n• User ID -> {doctor.user_id}\n• Full Name -> {fullName}\n• Email -> {userEmail}\n• Phone -> {userPhone}\n• License -> {license}\n• Department ID -> {dept}\n• DOB -> {dob}");
            
            return Ok(new { message = "Doctor record successfully deleted." }); 
        }
    }

    // 【修改】：配合模型变动，所有文本类型映射改为关联 ID，并加上新字段
    public class DoctorCreateUpdateDto 
    {
        public string FullName { get; set; } = null!; 
        public string Email { get; set; } = null!; 
        public string? Password { get; set; } 
        public string? Phone { get; set; } 
        public int GenderId { get; set; } 
        public bool UserStatus { get; set; } = true; // 对应 user.status
        public string LicenseNumber { get; set; } = null!; 
        public int SpecialtyId { get; set; } 
        public int TitleId { get; set; } 
        public int DepartmentId { get; set; } 
        public string DateOfBirth { get; set; } = null!; 
        public int? OfficeLocationId { get; set; } 
        public int YearsOfExperience { get; set; } 
        
        // --- 新增字段 ---
        public string? Address { get; set; }
        public string? PostalCode { get; set; }
        public string? OfficePhone { get; set; }
        public string DateJoin { get; set; } = null!;
        public string? DateLeft { get; set; }
        public int DoctorStatus { get; set; } // 对应 doctor.status
        public string? Remark { get; set; }
    }
}