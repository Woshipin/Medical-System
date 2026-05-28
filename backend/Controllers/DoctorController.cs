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
                    .ThenInclude(u => u!.Gender) 
                .ToListAsync(); 

            // 銆愭牳蹇冧慨澶嶃€戯細鍦?Select 鏌ヨ鎶曞奖涓紝琛ュ厖 qualifications, biography, resumePdf 瀛楁杩斿洖缁欏墠绔?
            var result = doctors.Select(d => new 
            {
                d.Id,
                userId = d.UserId,
                licenseNumber = d.LicenseNumber,
                specialtyId = d.SpecialtyId,
                titleId = d.TitleId,
                departmentId = d.DepartmentId,
                dateOfBirth = d.DateOfBirth.ToString("yyyy-MM-dd"),
                officeLocationId = d.OfficeLocationId,
                yearsOfExperience = d.YearsOfExperience,
                d.Address,
                postalCode = d.PostalCode,
                officePhone = d.OfficePhone,
                dateJoin = d.DateJoin.ToString("yyyy-MM-dd"),
                dateLeft = d.DateLeft?.ToString("yyyy-MM-dd"),
                d.Status,
                d.Remark,
                d.Qualifications, // 琛ュ叏杩斿洖
                d.Biography, // 琛ュ叏杩斿洖
                resumePdf = d.ResumePdf != null ? Convert.ToBase64String(d.ResumePdf) : null, // 琛ュ叏浜岃繘鍒惰浆Base64
                User = d.User != null ? new
                {
                    d.User.Id,
                    FullName = d.User.FullName,
                    d.User.Email,
                    d.User.PhoneNumber,
                    GenderId = d.User.GenderId, // 鎻愪緵鎬у埆澶栭敭 ID 鐢ㄤ簬鍓嶇鍏滃簳鍖归厤
                    d.User.Role,
                    d.User.Status,
                    Gender = d.User.Gender != null ? new { d.User.Gender.id, d.User.Gender.name } : null
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
                Status = input.UserStatus, 
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

            // 銆愭牳蹇冧慨澶嶃€戯細鍦ㄥ疄浣撳疄渚嬪寲涓紝鏄犲皠骞跺瓨鍏?DTO 涓紶鏉ョ殑璧勮川銆佺畝浠嬪拰 PDF 浜岃繘鍒剁畝鍘嗘暟鎹?
            var doctor = new Doctor 
            {
                UserId = user.Id, 
                LicenseNumber = input.LicenseNumber,
                SpecialtyId = input.SpecialtyId,
                TitleId = input.TitleId,
                DepartmentId = input.DepartmentId,
                DateOfBirth = DateOnly.Parse(input.DateOfBirth),
                OfficeLocationId = input.OfficeLocationId,
                YearsOfExperience = input.YearsOfExperience,
                Address = input.Address,
                PostalCode = input.PostalCode,
                OfficePhone = input.OfficePhone,
                DateJoin = DateOnly.Parse(input.DateJoin),
                DateLeft = string.IsNullOrEmpty(input.DateLeft) ? null : DateOnly.Parse(input.DateLeft),
                Status = input.DoctorStatus,
                Remark = input.Remark,
                Qualifications = input.Qualifications, // 鏄犲皠瀛樺叆鏁版嵁搴?
                Biography = input.Biography, // 鏄犲皠瀛樺叆鏁版嵁搴?
                ResumePdf = string.IsNullOrEmpty(input.ResumePdf) ? null : Convert.FromBase64String(input.ResumePdf), // 鏄犲皠杞瓨浜岃繘鍒?
                UpdatedAt = DateTime.Now
            };

            _context.Doctors.Add(doctor); 
            await _context.SaveChangesAsync(); 

            await _activityLog.LogAsync("Created", $"Created new Doctor Profile & User account:\n鈥?User ID -> {user.Id}\n鈥?Full Name -> {user.FullName}\n鈥?Email -> {user.Email}\n鈥?Phone -> {user.PhoneNumber ?? "None"}\n鈥?User Status -> {(user.Status == 1 ? "Active" : "Inactive")}\n鈥?License Number -> {doctor.LicenseNumber}\n鈥?Specialty ID -> {doctor.SpecialtyId}\n鈥?Department ID -> {doctor.DepartmentId}\n鈥?Doctor Status Code -> {doctor.Status}");

            return Ok(new { message = "Doctor successfully created." }); 
        }

        [HttpPut("{id}")] 
        public async Task<IActionResult> Update(int id, [FromBody] DoctorCreateUpdateDto input) 
        {
            var doctor = await _context.Doctors.Include(d => d.User).FirstOrDefaultAsync(d => d.Id == id); 
            if (doctor == null || doctor.User == null) 
                return NotFound(new { message = "Doctor not found." }); 

            var changes = new List<string>(); 
            if (doctor.User.FullName != input.FullName) changes.Add($"鈥?Full Name -> {doctor.User.FullName} 鉃?{input.FullName}"); 
            if (doctor.User.Email != input.Email) changes.Add($"鈥?Email -> {doctor.User.Email} 鉃?{input.Email}"); 
            if (doctor.User.PhoneNumber != input.Phone) changes.Add($"鈥?Phone -> {doctor.User.PhoneNumber ?? "None"} 鉃?{input.Phone ?? "None"}"); 
            if (doctor.User.GenderId != input.GenderId) changes.Add($"鈥?Gender ID -> {doctor.User.GenderId} 鉃?{input.GenderId}"); 
            
            if (doctor.User.Status != input.UserStatus) changes.Add($"鈥?User Status -> {(doctor.User.Status == 1 ? "Active" : "Inactive")} 鉃?{(input.UserStatus == 1 ? "Active" : "Inactive")}"); 

            if (doctor.LicenseNumber != input.LicenseNumber) changes.Add($"鈥?License -> {doctor.LicenseNumber} 鉃?{input.LicenseNumber}"); 
            if (doctor.SpecialtyId != input.SpecialtyId) changes.Add($"鈥?Specialty ID -> {doctor.SpecialtyId} 鉃?{input.SpecialtyId}"); 
            if (doctor.TitleId != input.TitleId) changes.Add($"鈥?Title ID -> {doctor.TitleId} 鉃?{input.TitleId}"); 
            if (doctor.DepartmentId != input.DepartmentId) changes.Add($"鈥?Department ID -> {doctor.DepartmentId} 鉃?{input.DepartmentId}"); 
            if (doctor.DateOfBirth != DateOnly.Parse(input.DateOfBirth)) changes.Add($"鈥?Date Of Birth -> {doctor.DateOfBirth} 鉃?{input.DateOfBirth}"); 
            if (doctor.OfficeLocationId != input.OfficeLocationId) changes.Add($"鈥?Office Location ID -> {doctor.OfficeLocationId} 鉃?{input.OfficeLocationId}"); 
            if (doctor.YearsOfExperience != input.YearsOfExperience) changes.Add($"鈥?Experience Years -> {doctor.YearsOfExperience} 鉃?{input.YearsOfExperience}"); 
            if (doctor.Status != input.DoctorStatus) changes.Add($"鈥?Doctor Status Code -> {doctor.Status} 鉃?{input.DoctorStatus}");

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
            doctor.User.Status = input.UserStatus; 

            var updateResult = await _userManager.UpdateAsync(doctor.User); 
            if (!updateResult.Succeeded) return BadRequest(new { message = "Failed to update user." }); 

            if (!string.IsNullOrWhiteSpace(input.Password)) 
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(doctor.User); 
                var pwdResult = await _userManager.ResetPasswordAsync(doctor.User, token, input.Password); 
                if (!pwdResult.Succeeded) return BadRequest(new { message = "Failed to update password." }); 
                changes.Add("鈥?Password -> [Modified]"); 
            }

            doctor.LicenseNumber = input.LicenseNumber;
            doctor.SpecialtyId = input.SpecialtyId;
            doctor.TitleId = input.TitleId;
            doctor.DepartmentId = input.DepartmentId;
            doctor.DateOfBirth = DateOnly.Parse(input.DateOfBirth);
            doctor.OfficeLocationId = input.OfficeLocationId;
            doctor.YearsOfExperience = input.YearsOfExperience;
            doctor.Address = input.Address;
            doctor.PostalCode = input.PostalCode;
            doctor.OfficePhone = input.OfficePhone;
            doctor.DateJoin = DateOnly.Parse(input.DateJoin);
            doctor.DateLeft = string.IsNullOrEmpty(input.DateLeft) ? null : DateOnly.Parse(input.DateLeft);
            doctor.Status = input.DoctorStatus;
            doctor.Remark = input.Remark;
            
            // 銆愭牳蹇冧慨澶嶃€戯細鍦ㄤ慨鏀归€昏緫涓紝鏄犲皠鏇存柊璧勮川銆佺畝浠嬩笌绠€鍘?PDF 瀛楁
            doctor.Qualifications = input.Qualifications; 
            doctor.Biography = input.Biography; 
            
            if (!string.IsNullOrEmpty(input.ResumePdf))
            {
                doctor.ResumePdf = Convert.FromBase64String(input.ResumePdf); 
                changes.Add("鈥?Resume PDF -> [Updated]");
            }
            
            doctor.UpdatedAt = DateTime.Now; 

            await _context.SaveChangesAsync(); 

            string logDetails = changes.Any() 
                ? $"Updated Doctor profile (ID: {id}):\n{string.Join("\n", changes)}" 
                : $"Updated Doctor profile (ID: {id}):\n鈥?No fields were modified."; 
            
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
            int dept = doctor.DepartmentId;
            string dob = doctor.DateOfBirth.ToString();

            if (doctor.User != null) 
            {
                await _userManager.DeleteAsync(doctor.User); 
            }
            else 
            {
                _context.Doctors.Remove(doctor); 
                await _context.SaveChangesAsync(); 
            }

            await _activityLog.LogAsync("Deleted", $"Deleted Doctor profile & associated User account:\n鈥?Doctor ID -> {id}\n鈥?User ID -> {doctor.UserId}\n鈥?Full Name -> {fullName}\n鈥?Email -> {userEmail}\n鈥?Phone -> {userPhone}\n鈥?License -> {license}\n鈥?Department ID -> {dept}\n鈥?DOB -> {dob}");
            
            return Ok(new { message = "Doctor record successfully deleted." }); 
        }
    }

    public class DoctorCreateUpdateDto 
    {
        public string FullName { get; set; } = null!; 
        public string Email { get; set; } = null!; 
        public string? Password { get; set; } 
        public string? Phone { get; set; } 
        public int GenderId { get; set; } 
        public int UserStatus { get; set; } = 1; 
        public string LicenseNumber { get; set; } = null!; 
        public int SpecialtyId { get; set; } 
        public int TitleId { get; set; } 
        public int DepartmentId { get; set; } 
        public string DateOfBirth { get; set; } = null!; 
        public int? OfficeLocationId { get; set; } 
        public int YearsOfExperience { get; set; } 
        public string? Address { get; set; }
        public string? PostalCode { get; set; }
        public string? OfficePhone { get; set; }
        public string DateJoin { get; set; } = null!;
        public string? DateLeft { get; set; }
        public int DoctorStatus { get; set; } 
        public string? Remark { get; set; }

        // ==================== 鏍稿績琛ュ叏锛欴TO 涓敞鍐屾槧灏勫瓧娈?====================
        public string? Qualifications { get; set; } 
        public string? Biography { get; set; } 
        public string? ResumePdf { get; set; } 
    }
}


