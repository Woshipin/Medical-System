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
using System.IO;
using Microsoft.Extensions.Logging;

namespace MedicalSystem.Controllers 
{
    [ApiController] 
    [Route("api/[controller]")] 
    public class DoctorsController : ControllerBase 
    {
        private readonly AppDbContext _context; 
        private readonly UserManager<User> _userManager; 
        private readonly IActivityLogService _activityLog; 
        private readonly ILogger<DoctorsController> _logger; 

        public DoctorsController(
            AppDbContext context, 
            UserManager<User> userManager, 
            IActivityLogService activityLog,
            ILogger<DoctorsController> logger) 
        {
            _context = context; 
            _userManager = userManager; 
            _activityLog = activityLog; 
            _logger = logger;
        }

        private async Task LogBothAsync(string actionName, string status, string message)
        {
            _logger.LogInformation("[DoctorsController.{ActionName}] {Status}: {Message}", actionName, status, message);
            await _activityLog.LogAsync(actionName, $"[{status}] {message}");
        }

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
                dateOfBirth = d.User != null ? d.User.DateOfBirth?.ToString("yyyy-MM-dd") : null, 
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
                status = d.Status, 
                d.Remark,
                d.Qualifications, 
                d.Biography, 
                User = d.User != null ? new
                {
                    d.User.Id,
                    FullName = d.User.FullName,
                    d.User.Email,
                    d.User.PhoneNumber,
                    PhoneNumberAlt = d.User.PhoneNumberAlt,
                    GenderId = d.User.GenderId, 
                    d.User.Role,
                    d.User.Status, 
                    Gender = d.User.Gender != null ? new { d.User.Gender.id, d.User.Gender.name } : null,
                    ProfileImageUrl = d.User.ProfileImageUrl 
                } : null
            });

            await LogBothAsync("Read", "Success", $"Retrieved {result.Count()} doctors data.");
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
            {
                await LogBothAsync("Read", "Failed", $"Doctor not found for ID: {id}");
                return NotFound(new { message = "Doctor not found." });
            }

            var result = new 
            {
                d.Id,
                userId = d.UserId,
                licenseNumber = d.LicenseNumber,
                specialtyId = d.SpecialtyId,
                positionId = d.PositionId, 
                departmentId = d.DepartmentId,
                dateOfBirth = d.User != null ? d.User.DateOfBirth?.ToString("yyyy-MM-dd") : null, 
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
                status = d.Status, 
                d.Remark,
                d.Qualifications, 
                d.Biography, 
                User = d.User != null ? new
                {
                    d.User.Id,
                    FullName = d.User.FullName,
                    d.User.Email,
                    d.User.PhoneNumber,
                    PhoneNumberAlt = d.User.PhoneNumberAlt,
                    GenderId = d.User.GenderId, 
                    d.User.Role,
                    d.User.Status,
                    Gender = d.User.Gender != null ? new { d.User.Gender.id, d.User.Gender.name } : null,
                    ProfileImageUrl = d.User.ProfileImageUrl 
                } : null
            };

            await LogBothAsync("Read", "Success", $"Retrieved doctor ID: {id}");
            return Ok(new { data = result, message = "Success" });
        }

        [HttpPost] 
        public async Task<IActionResult> Create([FromBody] DoctorCreateUpdateDto input) {
            var existingUser = await _userManager.FindByEmailAsync(input.Email); 
            if (existingUser != null) {
                await LogBothAsync("Create", "Failed", $"Email address already registered: {input.Email}");
                return BadRequest(new { 
                    message = "Validation failed.", 
                    errors = new { email = new[] { "This email address is already registered." } } 
                });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try {
                var savedImagePath = SaveBase64Image(input.ProfileImageUrl);

                var user = new User {
                    UserName = input.Email,
                    Email = input.Email,
                    FullName = input.FullName,
                    ProfileImageUrl = savedImagePath, 
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
                if (!result.Succeeded) {
                    var errorDict = new Dictionary<string, string[]>(); 
                    foreach (var err in result.Errors) {
                        if (err.Code.Contains("Password")) errorDict["password"] = new[] { err.Description };
                        else if (err.Code.Contains("Email")) errorDict["email"] = new[] { err.Description };
                        else errorDict["general"] = new[] { err.Description };
                    }
                    await LogBothAsync("Create", "Failed", $"Failed to create doctor account for {input.Email}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                    return BadRequest(new { message = "Failed to create user.", errors = errorDict });
                }

                var doctor = new Doctor {
                    UserId = user.Id, 
                    LicenseNumber = input.LicenseNumber,
                    SpecialtyId = input.SpecialtyId, 
                    PositionId = input.PositionId, 
                    DepartmentId = input.DepartmentId, 
                    OfficeLocationId = input.OfficeLocationId,
                    YearsOfExperience = input.YearsOfExperience,
                    OfficePhone = input.OfficePhone,
                    DateJoin = string.IsNullOrEmpty(input.DateJoin) ? null : DateOnly.Parse(input.DateJoin),
                    DateLeft = string.IsNullOrEmpty(input.DateLeft) ? null : DateOnly.Parse(input.DateLeft),
                    Status = input.DoctorStatus ?? 0, 
                    Remark = input.Remark,
                    Qualifications = input.Qualifications, 
                    Biography = input.Biography, 
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Doctors.Add(doctor); 
                await _context.SaveChangesAsync(); 
                await transaction.CommitAsync();

                var details = new List<string>
                {
                    $"• USER ID -> {user.Id}",
                    $"• FULL NAME -> {user.FullName}",
                    $"• EMAIL -> {user.Email}",
                    $"• DATE OF BIRTH -> {user.DateOfBirth?.ToString("yyyy-MM-dd") ?? "None"}",
                    $"• PHONE -> {user.PhoneNumber ?? "None"}",
                    $"• ALT PHONE -> {user.PhoneNumberAlt ?? "None"}",
                    $"• GENDER ID -> {user.GenderId?.ToString() ?? "None"}",
                    $"• ADDRESS LINE 1 -> {user.AddressLine1 ?? "None"}",
                    $"• ADDRESS LINE 2 -> {user.AddressLine2 ?? "None"}",
                    $"• CITY -> {user.City ?? "None"}",
                    $"• STATE -> {user.State ?? "None"}",
                    $"• POSTAL CODE -> {user.PostalCode ?? "None"}",
                    $"• COUNTRY -> {user.Country ?? "None"}",
                    $"• ACCOUNT STATUS -> {(user.Status == 1 ? "Active" : "Inactive")}",
                    $"• LICENSE NUMBER -> {doctor.LicenseNumber ?? "None"}",
                    $"• SPECIALTY ID -> {doctor.SpecialtyId?.ToString() ?? "None"}",
                    $"• POSITION ID -> {doctor.PositionId?.ToString() ?? "None"}",
                    $"• DEPARTMENT ID -> {doctor.DepartmentId?.ToString() ?? "None"}",
                    $"• OFFICE LOCATION ID -> {doctor.OfficeLocationId?.ToString() ?? "None"}",
                    $"• YEARS OF EXPERIENCE -> {doctor.YearsOfExperience?.ToString() ?? "None"}",
                    $"• OFFICE PHONE -> {doctor.OfficePhone ?? "None"}",
                    $"• DATE JOIN -> {doctor.DateJoin?.ToString("yyyy-MM-dd") ?? "None"}",
                    $"• DATE LEFT -> {doctor.DateLeft?.ToString("yyyy-MM-dd") ?? "None"}",
                    $"• WORK STATUS -> {doctor.Status}",
                    $"• QUALIFICATIONS -> {doctor.Qualifications ?? "None"}",
                    $"• BIOGRAPHY -> {doctor.Biography ?? "None"}",
                    $"• REMARK -> {doctor.Remark ?? "None"}"
                };

                await LogBothAsync("Create", "Success", $"Created new Doctor Profile & User account:\n{string.Join("\n", details)}");
                return Ok(new { message = "Doctor successfully created." }); 
            }
            catch (Exception ex) {
                await transaction.RollbackAsync();
                await LogBothAsync("Create", "Error", $"Failed to create doctor: {ex.Message}");
                return BadRequest(new { message = "Failed to create doctor: " + ex.Message });
            }
        }

        [HttpPut("{id}")] 
        public async Task<IActionResult> Update(int id, [FromBody] DoctorCreateUpdateDto input) {
            
            var doctor = await _context.Doctors.Include(d => d.User).FirstOrDefaultAsync(d => d.Id == id || d.UserId == id); 
            
            if (doctor == null || doctor.User == null) 
            {
                await LogBothAsync("Update", "Failed", $"Doctor or User not found for ID: {id}");
                return NotFound(new { message = "Doctor or User not found." }); 
            }

            if (!string.IsNullOrWhiteSpace(input.Email) && input.Email != doctor.User.Email) {
                var existingUser = await _userManager.FindByEmailAsync(input.Email); 
                if (existingUser != null && existingUser.Id != doctor.UserId) {
                    await LogBothAsync("Update", "Failed", $"Email address already taken by another user: {input.Email}");
                    return BadRequest(new { 
                        message = "Validation failed.", 
                        errors = new { email = new[] { "This email address is already taken by another user." } } 
                    });
                }
                doctor.User.Email = input.Email; 
                doctor.User.UserName = input.Email; 
                doctor.User.NormalizedEmail = input.Email.ToUpperInvariant();
                doctor.User.NormalizedUserName = input.Email.ToUpperInvariant();
            }

            var changes = new List<string>(); 

            if (doctor.User.FullName != input.FullName) 
                changes.Add($"• Full Name -> {doctor.User.FullName} ➔ {input.FullName}"); 
            
            if (doctor.User.Email != input.Email) 
                changes.Add($"• Email -> {doctor.User.Email} ➔ {input.Email}"); 
            
            if (doctor.User.PhoneNumber != input.Phone) 
                changes.Add($"• Phone -> {doctor.User.PhoneNumber ?? "None"} ➔ {input.Phone ?? "None"}"); 
            
            if (doctor.User.PhoneNumberAlt != input.PhoneNumberAlt) 
                changes.Add($"• Alt Phone -> {doctor.User.PhoneNumberAlt ?? "None"} ➔ {input.PhoneNumberAlt ?? "None"}"); 
            
            if (doctor.User.GenderId != input.GenderId) 
                changes.Add($"• Gender ID -> {doctor.User.GenderId} ➔ {input.GenderId}"); 
            
            if (doctor.User.Status != input.UserStatus) 
                changes.Add($"• User Status -> {(doctor.User.Status == 1 ? "Active" : "Inactive")} ➔ {(input.UserStatus == 1 ? "Active" : "Inactive")}"); 

            if (doctor.User.AddressLine1 != input.Address)
                changes.Add($"• Address Line 1 -> {doctor.User.AddressLine1 ?? "None"} ➔ {input.Address ?? "None"}");
            
            if (doctor.User.AddressLine2 != input.AddressLine2)
                changes.Add($"• Address Line 2 -> {doctor.User.AddressLine2 ?? "None"} ➔ {input.AddressLine2 ?? "None"}");
            
            if (doctor.User.City != input.City)
                changes.Add($"• City -> {doctor.User.City ?? "None"} ➔ {input.City ?? "None"}");
            
            if (doctor.User.State != input.State)
                changes.Add($"• State -> {doctor.User.State ?? "None"} ➔ {input.State ?? "None"}");
            
            if (doctor.User.PostalCode != input.PostalCode)
                changes.Add($"• Postal Code -> {doctor.User.PostalCode ?? "None"} ➔ {input.PostalCode ?? "None"}");
            
            if (doctor.User.Country != input.Country)
                changes.Add($"• Country -> {doctor.User.Country ?? "None"} ➔ {input.Country ?? "None"}");

            var inputDob = string.IsNullOrEmpty(input.DateOfBirth) ? (DateOnly?)null : DateOnly.Parse(input.DateOfBirth);
            if (doctor.User.DateOfBirth != inputDob)
                changes.Add($"• Date of Birth -> {doctor.User.DateOfBirth?.ToString("yyyy-MM-dd") ?? "None"} ➔ {inputDob?.ToString("yyyy-MM-dd") ?? "None"}");

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
            doctor.User.UpdatedAt = DateTime.UtcNow;

            _context.Entry(doctor.User).State = EntityState.Modified;

            if (!string.IsNullOrWhiteSpace(input.Password)) {
                var token = await _userManager.GeneratePasswordResetTokenAsync(doctor.User); 
                var pwdResult = await _userManager.ResetPasswordAsync(doctor.User, token, input.Password); 
                if (!pwdResult.Succeeded) {
                    await LogBothAsync("Update", "Failed", $"Failed to update password for doctor ID: {id}");
                    return BadRequest(new { message = "Failed to update password." }); 
                }
                changes.Add("• Password -> [Modified]"); 
            }

            if (doctor.LicenseNumber != input.LicenseNumber) 
                changes.Add($"• License Number -> {doctor.LicenseNumber ?? "None"} ➔ {input.LicenseNumber ?? "None"}"); 
            
            if (doctor.SpecialtyId != input.SpecialtyId) 
                changes.Add($"• Specialty ID -> {doctor.SpecialtyId?.ToString() ?? "None"} ➔ {input.SpecialtyId?.ToString() ?? "None"}"); 
            
            if (doctor.PositionId != input.PositionId) 
                changes.Add($"• Position ID -> {doctor.PositionId?.ToString() ?? "None"} ➔ {input.PositionId?.ToString() ?? "None"}"); 
            
            if (doctor.DepartmentId != input.DepartmentId) 
                changes.Add($"• Department ID -> {doctor.DepartmentId?.ToString() ?? "None"} ➔ {input.DepartmentId?.ToString() ?? "None"}"); 
            
            if (doctor.OfficeLocationId != input.OfficeLocationId) 
                changes.Add($"• Office Location ID -> {doctor.OfficeLocationId?.ToString() ?? "None"} ➔ {input.OfficeLocationId?.ToString() ?? "None"}"); 
            
            if (doctor.YearsOfExperience != input.YearsOfExperience) 
                changes.Add($"• Years of Experience -> {doctor.YearsOfExperience?.ToString() ?? "None"} ➔ {input.YearsOfExperience?.ToString() ?? "None"}"); 
            
            if (doctor.OfficePhone != input.OfficePhone) 
                changes.Add($"• Office Phone -> {doctor.OfficePhone ?? "None"} ➔ {input.OfficePhone ?? "None"}"); 

            var inputJoin = string.IsNullOrEmpty(input.DateJoin) ? (DateOnly?)null : DateOnly.Parse(input.DateJoin);
            if (doctor.DateJoin != inputJoin)
                changes.Add($"• Date Join -> {doctor.DateJoin?.ToString("yyyy-MM-dd") ?? "None"} ➔ {inputJoin?.ToString("yyyy-MM-dd") ?? "None"}");

            var inputLeft = string.IsNullOrEmpty(input.DateLeft) ? (DateOnly?)null : DateOnly.Parse(input.DateLeft);
            if (doctor.DateLeft != inputLeft)
                changes.Add($"• Date Left -> {doctor.DateLeft?.ToString("yyyy-MM-dd") ?? "None"} ➔ {inputLeft?.ToString("yyyy-MM-dd") ?? "None"}");

            if (doctor.Status != input.DoctorStatus) 
                changes.Add($"• Work Status -> {doctor.Status} ➔ {input.DoctorStatus}");
            
            if (doctor.Qualifications != input.Qualifications)
                changes.Add($"• Qualifications -> {doctor.Qualifications ?? "None"} ➔ {input.Qualifications ?? "None"}");
            
            if (doctor.Biography != input.Biography)
                changes.Add($"• Biography -> {doctor.Biography ?? "None"} ➔ {input.Biography ?? "None"}");
            
            if (doctor.Remark != input.Remark)
                changes.Add($"• Remark -> {doctor.Remark ?? "None"} ➔ {input.Remark ?? "None"}");

            if (!string.IsNullOrEmpty(input.ProfileImageUrl) && input.ProfileImageUrl != doctor.User.ProfileImageUrl) {
                changes.Add("• Profile Image -> [Modified]");
                doctor.User.ProfileImageUrl = SaveBase64Image(input.ProfileImageUrl);
            }

            doctor.LicenseNumber = input.LicenseNumber;
            doctor.SpecialtyId = input.SpecialtyId;
            doctor.PositionId = input.PositionId; 
            doctor.DepartmentId = input.DepartmentId;
            doctor.OfficeLocationId = input.OfficeLocationId;
            doctor.YearsOfExperience = input.YearsOfExperience;
            doctor.OfficePhone = input.OfficePhone;
            doctor.DateJoin = inputJoin;
            doctor.DateLeft = inputLeft;
            doctor.Status = input.DoctorStatus ?? 0; 
            doctor.Remark = input.Remark;
            doctor.Qualifications = input.Qualifications; 
            doctor.Biography = input.Biography; 
            doctor.UpdatedAt = DateTime.UtcNow; 

            await _context.SaveChangesAsync(); 

            string logDetails = changes.Any() 
                ? $"Updated Doctor profile (ID: {id}):\n{string.Join("\n", changes)}" 
                : $"Updated Doctor profile (ID: {id}):\n• No fields were modified."; 
            
            await LogBothAsync("Update", "Success", logDetails); 

            return Ok(new { message = "Doctor information updated." }); 
        }

        [HttpDelete("{id}")] 
        public async Task<IActionResult> Delete(int id) {
            var doctor = await _context.Doctors.Include(d => d.User).FirstOrDefaultAsync(d => d.Id == id); 
            if (doctor == null || doctor.User == null || doctor.User.Role != UserRole.Doctor) 
            {
                await LogBothAsync("Delete", "Failed", $"Doctor not found for ID: {id}");
                return NotFound(new { message = "Doctor not found." }); 
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try {
                var user = doctor.User;

                _context.Doctors.Remove(doctor); 
                await _context.SaveChangesAsync(); 

                var result = await _userManager.DeleteAsync(user); 
                if (!result.Succeeded) {
                    await transaction.RollbackAsync();
                    await LogBothAsync("Delete", "Failed", $"Failed to delete doctor ID: {id}. Errors: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                    return BadRequest(new { message = "Failed to delete user: " + string.Join(", ", result.Errors.Select(e => e.Description)) });
                }

                await transaction.CommitAsync();

                var deletedDetails = new List<string>
                {
                    $"• USER ID -> {user.Id}",
                    $"• FULL NAME -> {user.FullName}",
                    $"• EMAIL -> {user.Email}",
                    $"• DATE OF BIRTH -> {user.DateOfBirth?.ToString("yyyy-MM-dd") ?? "None"}",
                    $"• PHONE -> {user.PhoneNumber ?? "None"}",
                    $"• ALT PHONE -> {user.PhoneNumberAlt ?? "None"}",
                    $"• GENDER ID -> {user.GenderId?.ToString() ?? "None"}",
                    $"• ADDRESS LINE 1 -> {user.AddressLine1 ?? "None"}",
                    $"• ADDRESS LINE 2 -> {user.AddressLine2 ?? "None"}",
                    $"• CITY -> {user.City ?? "None"}",
                    $"• STATE -> {user.State ?? "None"}",
                    $"• POSTAL CODE -> {user.PostalCode ?? "None"}",
                    $"• COUNTRY -> {user.Country ?? "None"}",
                    $"• ACCOUNT STATUS -> {(user.Status == 1 ? "Active" : "Inactive")}",
                    $"• LICENSE NUMBER -> {doctor.LicenseNumber ?? "None"}",
                    $"• SPECIALTY ID -> {doctor.SpecialtyId?.ToString() ?? "None"}",
                    $"• POSITION ID -> {doctor.PositionId?.ToString() ?? "None"}",
                    $"• DEPARTMENT ID -> {doctor.DepartmentId?.ToString() ?? "None"}",
                    $"• OFFICE LOCATION ID -> {doctor.OfficeLocationId?.ToString() ?? "None"}",
                    $"• YEARS OF EXPERIENCE -> {doctor.YearsOfExperience?.ToString() ?? "None"}",
                    $"• OFFICE PHONE -> {doctor.OfficePhone ?? "None"}",
                    $"• DATE JOIN -> {doctor.DateJoin?.ToString("yyyy-MM-dd") ?? "None"}",
                    $"• DATE LEFT -> {doctor.DateLeft?.ToString("yyyy-MM-dd") ?? "None"}",
                    $"• WORK STATUS -> {doctor.Status}",
                    $"• QUALIFICATIONS -> {doctor.Qualifications ?? "None"}",
                    $"• BIOGRAPHY -> {doctor.Biography ?? "None"}",
                    $"• REMARK -> {doctor.Remark ?? "None"}"
                };

                await LogBothAsync("Delete", "Success", $"Deleted Doctor Profile and associated User account:\n{string.Join("\n", deletedDetails)}");
                return Ok(new { message = "Doctor record successfully deleted." }); 
            }
            catch (Exception ex) {
                await transaction.RollbackAsync();
                await LogBothAsync("Delete", "Error", $"Delete failed for doctor ID: {id} - {ex.Message}");
                return BadRequest(new { message = "Delete failed: " + ex.Message });
            }
        }
    }

    public class DoctorCreateUpdateDto {
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