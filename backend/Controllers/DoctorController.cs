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
using System.IO; // 引入文件流命名空间

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

        // 新增：安全保存 Base64 编码的头像图片至本地 user-image 文件夹
        private string? SaveBase64Image(string? base64Data)
        {
            if (string.IsNullOrEmpty(base64Data)) return null;

            if (base64Data.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    var commaIndex = base64Data.IndexOf(',');
                    if (commaIndex == -1) return base64Data;

                    var header = base64Data.Substring(0, commaIndex);
                    var extension = ".jpg"; 
                    if (header.Contains("png", StringComparison.OrdinalIgnoreCase)) extension = ".png";
                    else if (header.Contains("gif", StringComparison.OrdinalIgnoreCase)) extension = ".gif";
                    else if (header.Contains("webp", StringComparison.OrdinalIgnoreCase)) extension = ".webp";
                    else if (header.Contains("jpeg", StringComparison.OrdinalIgnoreCase)) extension = ".jpeg";

                    var base64Content = base64Data.Substring(commaIndex + 1);
                    var imageBytes = Convert.FromBase64String(base64Content);

                    var targetFolder = Path.Combine(Directory.GetCurrentDirectory(), "user-image");
                    if (!Directory.Exists(targetFolder))
                    {
                        Directory.CreateDirectory(targetFolder);
                    }

                    var fileName = $"{Guid.NewGuid()}{extension}";
                    var filePath = Path.Combine(targetFolder, fileName);
                    System.IO.File.WriteAllBytes(filePath, imageBytes);

                    return $"/user-image/{fileName}";
                }
                catch
                {
                    return base64Data;
                }
            }

            return base64Data; 
        }

        [HttpGet] 
        public async Task<IActionResult> GetDoctors() 
        {
            // 筛选并返回角色是 Doctor (2) 的医生记录
            var doctors = await _context.Doctors 
                .Include(d => d.User) 
                    .ThenInclude(u => u!.Gender) 
                .Where(d => d.User != null && d.User.Role == UserRole.Doctor)
                .ToListAsync(); 

            var result = doctors.Select(d => new 
            {
                d.Id,
                userId = d.UserId,
                licenseNumber = d.LicenseNumber,
                specialtyId = d.SpecialtyId,
                positionId = d.PositionId, 
                departmentId = d.DepartmentId,
                dateOfBirth = d.DateOfBirth?.ToString("yyyy-MM-dd"), 
                officeLocationId = d.OfficeLocationId,
                yearsOfExperience = d.YearsOfExperience,
                address = d.User != null ? d.User.AddressLine1 : null, 
                addressLine2 = d.User != null ? d.User.AddressLine2 : null,
                city = d.User != null ? d.User.City : null,
                state = d.User != null ? d.User.State : null,
                postalCode = d.User != null ? d.User.PostalCode : null, 
                country = d.User != null ? d.User.Country : null,
                phoneNumberAlt = d.User != null ? d.User.PhoneNumberAlt : null,
                profileImageUrl = d.User != null ? d.User.ProfileImageUrl : null,
                officePhone = d.OfficePhone,
                dateJoin = d.DateJoin?.ToString("yyyy-MM-dd"), 
                dateLeft = d.DateLeft?.ToString("yyyy-MM-dd"),
                status = d.User != null ? d.User.Status : 1, 
                d.Remark,
                d.Qualifications, 
                d.Biography, 
                User = d.User != null ? new
                {
                    d.User.Id,
                    FullName = d.User.FullName,
                    d.User.Email,
                    d.User.PhoneNumber,
                    GenderId = d.User.GenderId, 
                    d.User.Role,
                    d.User.Status,
                    Gender = d.User.Gender != null ? new { d.User.Gender.id, d.User.Gender.name } : null
                } : null
            });

            return Ok(new { data = result, message = "Success" }); 
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var d = await _context.Doctors
                .Include(d => d.User)
                    .ThenInclude(u => u!.Gender)
                .FirstOrDefaultAsync(d => d.Id == id && d.User != null && d.User.Role == UserRole.Doctor);
            
            if (d == null) 
                return NotFound(new { message = "Doctor not found." });

            var result = new 
            {
                d.Id,
                userId = d.UserId,
                licenseNumber = d.LicenseNumber,
                specialtyId = d.SpecialtyId,
                positionId = d.PositionId, 
                departmentId = d.DepartmentId,
                dateOfBirth = d.DateOfBirth?.ToString("yyyy-MM-dd"), 
                officeLocationId = d.OfficeLocationId,
                yearsOfExperience = d.YearsOfExperience,
                address = d.User != null ? d.User.AddressLine1 : null, 
                addressLine2 = d.User != null ? d.User.AddressLine2 : null,
                city = d.User != null ? d.User.City : null,
                state = d.User != null ? d.User.State : null,
                postalCode = d.User != null ? d.User.PostalCode : null, 
                country = d.User != null ? d.User.Country : null,
                phoneNumberAlt = d.User != null ? d.User.PhoneNumberAlt : null,
                profileImageUrl = d.User != null ? d.User.ProfileImageUrl : null,
                officePhone = d.OfficePhone,
                dateJoin = d.DateJoin?.ToString("yyyy-MM-dd"), 
                dateLeft = d.DateLeft?.ToString("yyyy-MM-dd"),
                status = d.User != null ? d.User.Status : 1, 
                d.Remark,
                d.Qualifications, 
                d.Biography, 
                User = d.User != null ? new
                {
                    d.User.Id,
                    FullName = d.User.FullName,
                    d.User.Email,
                    d.User.PhoneNumber,
                    GenderId = d.User.GenderId, 
                    d.User.Role,
                    d.User.Status,
                    Gender = d.User.Gender != null ? new { d.User.Gender.id, d.User.Gender.name } : null
                } : null
            };

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

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 保存医生头像到本地文件夹
                var savedImagePath = SaveBase64Image(input.ProfileImageUrl);

                var user = new User 
                {
                    UserName = input.Email,
                    Email = input.Email,
                    FullName = input.FullName,
                    ProfileImageUrl = savedImagePath, // 本地图像路径
                    PhoneNumber = input.Phone,
                    PhoneNumberAlt = input.PhoneNumberAlt,
                    GenderId = input.GenderId,
                    Role = UserRole.Doctor, 
                    Status = input.UserStatus, 
                    AddressLine1 = input.Address, 
                    AddressLine2 = input.AddressLine2,
                    City = input.City,
                    State = input.State,
                    PostalCode = input.PostalCode,
                    Country = input.Country,
                    DateOfBirth = string.IsNullOrEmpty(input.DateOfBirth) ? null : DateOnly.Parse(input.DateOfBirth),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
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
                    SpecialtyId = input.SpecialtyId, 
                    PositionId = input.PositionId, 
                    DepartmentId = input.DepartmentId, 
                    DateOfBirth = string.IsNullOrEmpty(input.DateOfBirth) ? null : DateOnly.Parse(input.DateOfBirth),
                    OfficeLocationId = input.OfficeLocationId,
                    YearsOfExperience = input.YearsOfExperience,
                    OfficePhone = input.OfficePhone,
                    DateJoin = string.IsNullOrEmpty(input.DateJoin) ? null : DateOnly.Parse(input.DateJoin),
                    DateLeft = string.IsNullOrEmpty(input.DateLeft) ? null : DateOnly.Parse(input.DateLeft),
                    Remark = input.Remark,
                    Qualifications = input.Qualifications, 
                    Biography = input.Biography, 
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Doctors.Add(doctor); 
                await _context.SaveChangesAsync(); 
                await transaction.CommitAsync();

                await _activityLog.LogAsync("Created", $"Created new Doctor Profile & User account:\n• User ID -> {user.Id}\n• Full Name -> {user.FullName}");
                return Ok(new { message = "Doctor successfully created." }); 
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(new { message = "Failed to create doctor: " + ex.Message });
            }
        }

        [HttpPut("{id}")] 
        public async Task<IActionResult> Update(int id, [FromBody] DoctorCreateUpdateDto input) 
        {
            var doctor = await _context.Doctors.Include(d => d.User).FirstOrDefaultAsync(d => d.Id == id); 
            if (doctor == null || doctor.User == null || doctor.User.Role != UserRole.Doctor) 
                return NotFound(new { message = "Doctor not found." }); 

            var changes = new List<string>(); 
            if (doctor.User.FullName != input.FullName) changes.Add($"• Full Name -> {doctor.User.FullName} ➔ {input.FullName}"); 
            if (doctor.User.Email != input.Email) changes.Add($"• Email -> {doctor.User.Email} ➔ {input.Email}"); 
            if (doctor.User.PhoneNumber != input.Phone) changes.Add($"• Phone -> {doctor.User.PhoneNumber ?? "None"} ➔ {input.Phone ?? "None"}"); 
            if (doctor.User.GenderId != input.GenderId) changes.Add($"• Gender ID -> {doctor.User.GenderId} ➔ {input.GenderId}"); 
            if (doctor.User.Status != input.UserStatus) changes.Add($"• User Status -> {(doctor.User.Status == 1 ? "Active" : "Inactive")} ➔ {(input.UserStatus == 1 ? "Active" : "Inactive")}"); 

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

            // 更新本地图片并记录新路径
            if (!string.IsNullOrEmpty(input.ProfileImageUrl) && input.ProfileImageUrl != doctor.User.ProfileImageUrl)
            {
                doctor.User.ProfileImageUrl = SaveBase64Image(input.ProfileImageUrl);
            }

            doctor.User.FullName = input.FullName;
            doctor.User.DateOfBirth = string.IsNullOrEmpty(input.DateOfBirth) ? null : DateOnly.Parse(input.DateOfBirth);
            doctor.User.PhoneNumber = input.Phone;
            doctor.User.PhoneNumberAlt = input.PhoneNumberAlt;
            doctor.User.GenderId = input.GenderId;
            doctor.User.AddressLine1 = input.Address; 
            doctor.User.AddressLine2 = input.AddressLine2;
            doctor.User.City = input.City;
            doctor.User.State = input.State;
            doctor.User.PostalCode = input.PostalCode; 
            doctor.User.Country = input.Country;
            doctor.User.Status = input.UserStatus; 

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
            doctor.SpecialtyId = input.SpecialtyId;
            doctor.PositionId = input.PositionId; 
            doctor.DepartmentId = input.DepartmentId;
            doctor.DateOfBirth = string.IsNullOrEmpty(input.DateOfBirth) ? null : DateOnly.Parse(input.DateOfBirth);
            doctor.OfficeLocationId = input.OfficeLocationId;
            doctor.YearsOfExperience = input.YearsOfExperience;
            doctor.OfficePhone = input.OfficePhone;

            if (!string.IsNullOrEmpty(input.DateJoin))
                doctor.DateJoin = DateOnly.Parse(input.DateJoin);
            else
                doctor.DateJoin = null;

            if (!string.IsNullOrEmpty(input.DateLeft))
                doctor.DateLeft = DateOnly.Parse(input.DateLeft);
            else
                doctor.DateLeft = null;

            doctor.Remark = input.Remark;
            doctor.Qualifications = input.Qualifications; 
            doctor.Biography = input.Biography; 
            doctor.UpdatedAt = DateTime.UtcNow; 

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
            if (doctor == null || doctor.User == null || doctor.User.Role != UserRole.Doctor) 
                return NotFound(new { message = "Doctor not found." }); 

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var user = doctor.User;

                // 先清理物理医生副表记录
                _context.Doctors.Remove(doctor); 
                await _context.SaveChangesAsync(); 

                // 进而物理清理关联的核心用户表数据
                var result = await _userManager.DeleteAsync(user); 
                if (!result.Succeeded)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new { message = "Failed to delete user: " + string.Join(", ", result.Errors.Select(e => e.Description)) });
                }

                await transaction.CommitAsync();
                await _activityLog.LogAsync("Deleted", $"Deleted Doctor profile & associated User account:\n• Doctor ID -> {id}");
                return Ok(new { message = "Doctor record successfully deleted." }); 
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(new { message = "Delete failed: " + ex.Message });
            }
        }
    }

    // 在此补全 DTO 定义
    public class DoctorCreateUpdateDto 
    {
        public string FullName { get; set; } = null!; 
        public string Email { get; set; } = null!; 
        public string? Password { get; set; } 
        public string? Phone { get; set; } 
        public string? PhoneNumberAlt { get; set; } 
        public int GenderId { get; set; } 
        public int UserStatus { get; set; } = 1; 
        public string? ProfileImageUrl { get; set; }
        public string? Address { get; set; } 
        public string? AddressLine2 { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }

        public string? LicenseNumber { get; set; } 
        public int? SpecialtyId { get; set; } 
        public int? PositionId { get; set; } 
        public int? DepartmentId { get; set; } 
        public string? DateOfBirth { get; set; } 
        public int? OfficeLocationId { get; set; } 
        public int? YearsOfExperience { get; set; } 
        public string? OfficePhone { get; set; } 
        public string? DateJoin { get; set; } 
        public string? DateLeft { get; set; }
        public int? DoctorStatus { get; set; } 
        public string? Remark { get; set; }
        public string? Qualifications { get; set; } 
        public string? Biography { get; set; } 
    }
}