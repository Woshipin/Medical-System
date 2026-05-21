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
                .Include(d => d.User) 
                    .ThenInclude(u => u.Gender) 
                .ToListAsync(); 

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
                User = d.User != null ? new
                {
                    d.User.Id,
                    d.User.FullName,
                    d.User.Email,
                    d.User.PhoneNumber,
                    d.User.GenderId,
                    d.User.Role,
                    d.User.IsActive,
                    Gender = d.User.Gender != null ? new { d.User.Gender.Id, d.User.Gender.Name } : null
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
                FullName = input.FullName,
                PhoneNumber = input.Phone,
                GenderId = input.GenderId,
                Role = UserRole.Doctor, 
                IsActive = input.IsActive,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
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

            await _activityLog.LogAsync("Created", $"Created new Doctor Profile & User account:\n• User ID -> {user.Id}\n• Full Name -> {user.FullName}\n• Email -> {user.Email}\n• Phone -> {user.PhoneNumber ?? "None"}\n• Status -> {(user.IsActive ? "Active" : "Inactive")}\n• License Number -> {doctor.LicenseNumber}\n• Specialty -> {doctor.Specialty}\n• Title -> {doctor.Title}\n• Department -> {doctor.Department}\n• DOB -> {doctor.DateOfBirth}\n• Office Location -> {doctor.OfficeLocation ?? "None"}\n• Experience Years -> {doctor.YearsOfExperience}");

            return Ok(new { message = "Doctor successfully created." }); 
        }

        [HttpPut("{id}")] 
        public async Task<IActionResult> Update(int id, [FromBody] DoctorCreateUpdateDto input) 
        {
            var doctor = await _context.Doctors.Include(d => d.User).FirstOrDefaultAsync(d => d.Id == id); 
            if (doctor == null || doctor.User == null) 
                return NotFound(new { message = "Doctor not found." }); 

            var changes = new List<string>(); 
            if (doctor.User.FullName != input.FullName) changes.Add($"• Full Name -> {doctor.User.FullName} ➔ {input.FullName}"); 
            if (doctor.User.Email != input.Email) changes.Add($"• Email -> {doctor.User.Email} ➔ {input.Email}"); 
            if (doctor.User.PhoneNumber != input.Phone) changes.Add($"• Phone -> {doctor.User.PhoneNumber ?? "None"} ➔ {input.Phone ?? "None"}"); 
            if (doctor.User.GenderId != input.GenderId) changes.Add($"• Gender ID -> {doctor.User.GenderId} ➔ {input.GenderId}"); 
            if (doctor.User.IsActive != input.IsActive) changes.Add($"• Status -> {(doctor.User.IsActive ? "Active" : "Inactive")} ➔ {(input.IsActive ? "Active" : "Inactive")}"); 

            if (doctor.LicenseNumber != input.LicenseNumber) changes.Add($"• License -> {doctor.LicenseNumber} ➔ {input.LicenseNumber}"); 
            if (doctor.Specialty != input.Specialty) changes.Add($"• Specialty -> {doctor.Specialty} ➔ {input.Specialty}"); 
            if (doctor.Title != input.Title) changes.Add($"• Title -> {doctor.Title} ➔ {input.Title}"); 
            if (doctor.Department != input.Department) changes.Add($"• Department -> {doctor.Department} ➔ {input.Department}"); 
            if (doctor.DateOfBirth != DateOnly.Parse(input.DateOfBirth)) changes.Add($"• Date Of Birth -> {doctor.DateOfBirth} ➔ {input.DateOfBirth}"); 
            if (doctor.OfficeLocation != input.OfficeLocation) changes.Add($"• Office Location -> {doctor.OfficeLocation ?? "None"} ➔ {input.OfficeLocation ?? "None"}"); 
            if (doctor.YearsOfExperience != input.YearsOfExperience) changes.Add($"• Experience Years -> {doctor.YearsOfExperience} ➔ {input.YearsOfExperience}"); 

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
                changes.Add("• Password -> [Modified]"); 
            }

            doctor.LicenseNumber = input.LicenseNumber;
            doctor.Specialty = input.Specialty;
            doctor.Title = input.Title;
            doctor.Department = input.Department;
            doctor.DateOfBirth = DateOnly.Parse(input.DateOfBirth);
            doctor.OfficeLocation = input.OfficeLocation;
            doctor.YearsOfExperience = input.YearsOfExperience;
            doctor.UpdatedAt = DateTime.Now; 

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
            var doctor = await _context.Doctors.Include(d => d.User).FirstOrDefaultAsync(d => d.Id == id); 
            if (doctor == null) return NotFound(new { message = "Record not found." }); 

            string userEmail = doctor.User?.Email ?? "None"; 
            string fullName = doctor.User?.FullName ?? "None"; 
            string userPhone = doctor.User?.PhoneNumber ?? "None"; 
            string license = doctor.LicenseNumber;
            string specialty = doctor.Specialty;
            string title = doctor.Title;
            string dept = doctor.Department;
            string dob = doctor.DateOfBirth.ToString();
            string office = doctor.OfficeLocation ?? "None";
            int exp = doctor.YearsOfExperience;

            if (doctor.User != null) 
            {
                await _userManager.DeleteAsync(doctor.User); 
            }
            else 
            {
                _context.Doctors.Remove(doctor); 
                await _context.SaveChangesAsync(); 
            }

            await _activityLog.LogAsync("Deleted", $"Deleted Doctor profile & associated User account:\n• Doctor ID -> {id}\n• User ID -> {doctor.UserId}\n• Full Name -> {fullName}\n• Email -> {userEmail}\n• Phone -> {userPhone}\n• License -> {license}\n• Specialty -> {specialty}\n• Title -> {title}\n• Department -> {dept}\n• DOB -> {dob}\n• Office Location -> {office}\n• Experience Years -> {exp}");
            
            return Ok(new { message = "Doctor record successfully deleted." }); 
        }
    }

    // ==========================================
    // 【修复新增】：在此补全缺失的 DTO 类定义
    // ==========================================
    public class DoctorCreateUpdateDto 
    {
        public string FullName { get; set; } = null!; 
        public string Email { get; set; } = null!; 
        public string? Password { get; set; } 
        public string? Phone { get; set; } 
        public int GenderId { get; set; } 
        public bool IsActive { get; set; } 
        public string LicenseNumber { get; set; } = null!; 
        public string Specialty { get; set; } = null!; 
        public string Title { get; set; } = null!; 
        public string Department { get; set; } = null!; 
        public string DateOfBirth { get; set; } = null!; 
        public string? OfficeLocation { get; set; } 
        public int YearsOfExperience { get; set; } 
    }
}