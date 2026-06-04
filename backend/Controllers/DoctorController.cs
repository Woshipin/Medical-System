using System; 
using System.Collections.Generic; 
using System.Linq; 
using System.Threading.Tasks; 
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization; 
using Microsoft.AspNetCore.Identity; 
using Microsoft.AspNetCore.Mvc; 
using Microsoft.EntityFrameworkCore; 
using MedicalSystem.Models; 
using MedicalSystem.Data;
using MedicalSystem.Services; 
using System.IO;
using Microsoft.Extensions.Logging;

namespace MedicalSystem.Controllers 
{
    [Route("api/[controller]")] 
    [ApiController] 
    public class DoctorsController : ControllerBase 
    {
        private readonly UserManager<User> _userManager; 
        private readonly AppDbContext _context;
        private readonly IActivityLogService _activityLog; 
        private readonly ILogger<DoctorsController> _logger;

        public DoctorsController(
            UserManager<User> userManager, 
            AppDbContext context, 
            IActivityLogService activityLog,
            ILogger<DoctorsController> logger) 
        {
            _userManager = userManager; 
            _context = context;
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
        public async Task<IActionResult> GetAll() 
        {
            var doctors = await _context.Doctors 
                .Include(d => d.User) 
                    .ThenInclude(u => u!.Gender) 
                .OrderByDescending(d => d.Id) 
                .ToListAsync(); 

            // 完美解决 500 JSON 循环引用序列化错误：利用 Select 投影出干净的匿名对象
            var resultList = doctors.Where(d => d.User != null).Select(d => new {
                id = d.Id,
                userId = d.UserId,
                licenseNumber = d.LicenseNumber,
                specialtyId = d.SpecialtyId,
                positionId = d.PositionId,
                departmentId = d.DepartmentId,
                officeLocationId = d.OfficeLocationId,
                yearsOfExperience = d.YearsOfExperience,
                officePhone = d.OfficePhone,
                dateJoin = d.DateJoin?.ToString("yyyy-MM-dd"),
                dateLeft = d.DateLeft?.ToString("yyyy-MM-dd"),
                status = d.Status,
                qualifications = d.Qualifications,
                biography = d.Biography,
                remark = d.Remark,
                user = new {
                    id = d.User!.Id,
                    fullName = d.User.FullName,
                    email = d.User.Email,
                    phoneNumber = d.User.PhoneNumber,
                    phoneNumberAlt = d.User.PhoneNumberAlt,
                    profileImageUrl = d.User.ProfileImageUrl,
                    genderId = d.User.GenderId,
                    role = d.User.Role,
                    status = d.User.Status,
                    dateOfBirth = d.User.DateOfBirth?.ToString("yyyy-MM-dd"),
                    addressLine1 = d.User.AddressLine1,
                    addressLine2 = d.User.AddressLine2,
                    city = d.User.City,
                    state = d.User.State,
                    postalCode = d.User.PostalCode,
                    country = d.User.Country,
                    gender = d.User.Gender != null ? new {
                        id = d.User.Gender.id,
                        name = d.User.Gender.name
                    } : null
                }
            });

            await LogBothAsync("Read", "Success", $"Retrieved {resultList.Count()} doctors database records.");
            return Ok(new { success = true, message = "Doctor list retrieved successfully.", data = resultList }); 
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var d = await _context.Doctors
                .Include(doc => doc.User)
                    .ThenInclude(u => u!.Gender)
                .FirstOrDefaultAsync(doc => doc.Id == id);
            
            if (d == null || d.User == null) 
            {
                await LogBothAsync("Read", "Failed", $"Doctor profile not found for ID: {id}");
                return NotFound(new { success = false, message = "Doctor not found." });
            }

            // 同样投影扁平对象，拒绝任何包含导航属性的实体被直接序列化
            var resultObj = new {
                id = d.Id,
                userId = d.UserId,
                licenseNumber = d.LicenseNumber,
                specialtyId = d.SpecialtyId,
                positionId = d.PositionId,
                departmentId = d.DepartmentId,
                officeLocationId = d.OfficeLocationId,
                yearsOfExperience = d.YearsOfExperience,
                officePhone = d.OfficePhone,
                dateJoin = d.DateJoin?.ToString("yyyy-MM-dd"),
                dateLeft = d.DateLeft?.ToString("yyyy-MM-dd"),
                status = d.Status,
                qualifications = d.Qualifications,
                biography = d.Biography,
                remark = d.Remark,
                user = new {
                    id = d.User!.Id,
                    fullName = d.User.FullName,
                    email = d.User.Email,
                    phoneNumber = d.User.PhoneNumber,
                    phoneNumberAlt = d.User.PhoneNumberAlt,
                    profileImageUrl = d.User.ProfileImageUrl,
                    genderId = d.User.GenderId,
                    role = d.User.Role,
                    status = d.User.Status,
                    dateOfBirth = d.User.DateOfBirth?.ToString("yyyy-MM-dd"),
                    addressLine1 = d.User.AddressLine1,
                    addressLine2 = d.User.AddressLine2,
                    city = d.User.City,
                    state = d.User.State,
                    postalCode = d.User.PostalCode,
                    country = d.User.Country,
                    gender = d.User.Gender != null ? new {
                        id = d.User.Gender.id,
                        name = d.User.Gender.name
                    } : null
                }
            };

            await LogBothAsync("Read", "Success", $"Retrieved doctor profile ID: {id}");
            return Ok(new { success = true, message = "Doctor details retrieved successfully.", data = resultObj });
        }

        [HttpPost] 
        public async Task<IActionResult> Create([FromBody] DoctorDto model) 
        {
            if (!ModelState.IsValid) 
            {
                var fieldErrors = ModelState
                    .Where(x => x.Value != null && x.Value.Errors.Count > 0)
                    .ToDictionary(
                        x => x.Key,
                        x => x.Value!.Errors.First().ErrorMessage
                    );

                await LogBothAsync("Create", "Failed", "Model validation failed.");
                return BadRequest(new { success = false, message = "Please fix the validation errors below.", errors = fieldErrors }); 
            }

            if (string.IsNullOrEmpty(model.Password))
            {
                await LogBothAsync("Create", "Failed", "Password is required for new doctor account creation.");
                return BadRequest(new { success = false, message = "Password is required.", errors = new Dictionary<string, string> { { "password", "Password is required for creating a new doctor account." } } });
            }

            var existingUser = await _userManager.FindByEmailAsync(model.Email); 
            if (existingUser != null) 
            {
                await LogBothAsync("Create", "Failed", $"Email already taken: {model.Email}");
                return BadRequest(new { success = false, message = "The email address is already registered.", errors = new Dictionary<string, string> { { "email", "This email address is already registered." } } }); 
            }

            if (model.Role != UserRole.Doctor)
            {
                await LogBothAsync("Create", "Failed", $"Unauthorized role type assignment: {model.Role}");
                return BadRequest(new { success = false, message = "Unauthorized role type assignment.", errors = (object?)null });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var savedImagePath = SaveBase64Image(model.ProfileImageUrl);

                var newUser = new User 
                {
                    UserName = model.Email, 
                    Email = model.Email, 
                    FullName = model.FullName, 
                    ProfileImageUrl = savedImagePath, 
                    PhoneNumber = model.Phone, 
                    PhoneNumberAlt = model.PhoneNumberAlt,
                    GenderId = model.GenderId, 
                    DateOfBirth = string.IsNullOrEmpty(model.DateOfBirth) ? null : DateOnly.Parse(model.DateOfBirth),
                    AddressLine1 = model.Address,
                    AddressLine2 = model.AddressLine2,
                    City = model.City,
                    State = model.State,
                    PostalCode = model.PostalCode,
                    Country = model.Country,
                    Role = UserRole.Doctor, 
                    Status = model.UserStatus, 
                    CreatedAt = DateTime.UtcNow, 
                    UpdatedAt = DateTime.UtcNow 
                };

                var result = await _userManager.CreateAsync(newUser, model.Password); 

                if (!result.Succeeded)
                {
                    var identityErrors = result.Errors
                        .GroupBy(e => e.Code.Contains("Password") ? "password" : "general")
                        .ToDictionary(
                            g => g.Key,
                            g => string.Join(" ", g.Select(e => e.Description))
                        );

                    await LogBothAsync("Create", "Failed", $"Account creation failed for {model.Email}");
                    return BadRequest(new { success = false, message = "Account creation failed due to password policy constraints.", errors = identityErrors }); 
                }

                var doctorProfile = new Doctor
                {
                    UserId = newUser.Id,
                    LicenseNumber = model.LicenseNumber,
                    DepartmentId = model.DepartmentId,
                    SpecialtyId = model.SpecialtyId,
                    PositionId = model.PositionId,
                    OfficeLocationId = model.OfficeLocationId,
                    YearsOfExperience = model.YearsOfExperience,
                    OfficePhone = model.OfficePhone,
                    DateJoin = string.IsNullOrEmpty(model.DateJoin) ? null : DateOnly.Parse(model.DateJoin),
                    DateLeft = string.IsNullOrEmpty(model.DateLeft) ? null : DateOnly.Parse(model.DateLeft),
                    Status = model.DoctorStatus ?? 0,
                    Qualifications = model.Qualifications,
                    Biography = model.Biography,
                    Remark = model.Remark,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Doctors.Add(doctorProfile);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var details = new List<string>
                {
                    $"• USER ID -> {newUser.Id}",
                    $"• FULL NAME -> {newUser.FullName}",
                    $"• EMAIL -> {newUser.Email}",
                    $"• LICENSE -> {doctorProfile.LicenseNumber}"
                };

                await LogBothAsync("Create", "Success", $"Created new Doctor account and profile:\n{string.Join("\n", details)}");
                
                return Ok(new { success = true, message = "Doctor registered successfully.", id = doctorProfile.Id }); 
            }
            catch(Exception ex)
            {
                await transaction.RollbackAsync();
                await LogBothAsync("Create", "Error", $"Failed to create doctor: {ex.Message}");
                return BadRequest(new { success = false, message = "System runtime exception occurred on creation." });
            }
        }

        [HttpPut("{id}")] 
        public async Task<IActionResult> Update(int id, [FromBody] DoctorDto model) 
        {
            if (!ModelState.IsValid) 
            {
                var fieldErrors = ModelState
                    .Where(x => x.Value != null && x.Value.Errors.Count > 0)
                    .ToDictionary(
                        x => x.Key,
                        x => x.Value!.Errors.First().ErrorMessage
                    );

                await LogBothAsync("Update", "Failed", $"Model validation failed for doctor ID: {id}");
                return BadRequest(new { success = false, message = "Please fix the validation errors below.", errors = fieldErrors }); 
            }

            var doctor = await _context.Doctors.Include(d => d.User).FirstOrDefaultAsync(d => d.Id == id);
            
            if (doctor == null || doctor.User == null) 
            {
                await LogBothAsync("Update", "Failed", $"Doctor not found for ID: {id}");
                return NotFound(new { success = false, message = "Doctor profile not found." }); 
            }

            if (!string.IsNullOrWhiteSpace(model.Email) && model.Email != doctor.User.Email) {
                var existingUser = await _userManager.FindByEmailAsync(model.Email); 
                if (existingUser != null && existingUser.Id != doctor.UserId) {
                    await LogBothAsync("Update", "Failed", $"Email address already taken: {model.Email}");
                    return BadRequest(new { success = false, message = "Email already in use.", errors = new Dictionary<string, string> { { "email", "This email address is already taken by another user." } } });
                }
                doctor.User.Email = model.Email; 
                doctor.User.UserName = model.Email;
                doctor.User.NormalizedEmail = model.Email.ToUpperInvariant();
                doctor.User.NormalizedUserName = model.Email.ToUpperInvariant();
            }

            var inputDob = string.IsNullOrEmpty(model.DateOfBirth) ? (DateOnly?)null : DateOnly.Parse(model.DateOfBirth);
            var inputJoin = string.IsNullOrEmpty(model.DateJoin) ? (DateOnly?)null : DateOnly.Parse(model.DateJoin);
            var inputLeft = string.IsNullOrEmpty(model.DateLeft) ? (DateOnly?)null : DateOnly.Parse(model.DateLeft);

            if (!string.IsNullOrEmpty(model.ProfileImageUrl) && model.ProfileImageUrl != doctor.User.ProfileImageUrl)
            {
                doctor.User.ProfileImageUrl = SaveBase64Image(model.ProfileImageUrl);
            }

            doctor.User.FullName = model.FullName;
            doctor.User.PhoneNumber = model.Phone;
            doctor.User.PhoneNumberAlt = model.PhoneNumberAlt;
            doctor.User.GenderId = model.GenderId;
            doctor.User.Status = model.UserStatus;
            doctor.User.DateOfBirth = inputDob;
            doctor.User.AddressLine1 = model.Address;
            doctor.User.AddressLine2 = model.AddressLine2;
            doctor.User.City = model.City;
            doctor.User.State = model.State;
            doctor.User.PostalCode = model.PostalCode;
            doctor.User.Country = model.Country;
            doctor.User.UpdatedAt = DateTime.UtcNow;

            doctor.LicenseNumber = model.LicenseNumber;
            doctor.DepartmentId = model.DepartmentId;
            doctor.SpecialtyId = model.SpecialtyId;
            doctor.PositionId = model.PositionId;
            doctor.OfficeLocationId = model.OfficeLocationId;
            doctor.YearsOfExperience = model.YearsOfExperience;
            doctor.OfficePhone = model.OfficePhone;
            doctor.DateJoin = inputJoin;
            doctor.DateLeft = inputLeft;
            doctor.Status = model.DoctorStatus ?? 0;
            doctor.Qualifications = model.Qualifications;
            doctor.Biography = model.Biography;
            doctor.Remark = model.Remark;
            doctor.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrEmpty(model.Password))
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(doctor.User);
                var pwdResult = await _userManager.ResetPasswordAsync(doctor.User, token, model.Password);
                if (!pwdResult.Succeeded) 
                {
                    var passwordErrors = pwdResult.Errors
                        .GroupBy(e => e.Code.Contains("Password") ? "password" : "general")
                        .ToDictionary(
                            g => g.Key,
                            g => string.Join(" ", g.Select(e => e.Description))
                        );

                    await LogBothAsync("Update", "Failed", $"Failed to update password for doctor ID: {id}");
                    return BadRequest(new { success = false, message = "Password update failed due to complexity requirements.", errors = passwordErrors });
                }
            }

            await _context.SaveChangesAsync();

            await LogBothAsync("Update", "Success", $"Updated Doctor details successfully (ID: {id})."); 
            return Ok(new { success = true, message = "Doctor profile updated successfully." }); 
        }

        [HttpDelete("{id}")] 
        public async Task<IActionResult> Delete(int id) 
        {
            var doctorProfile = await _context.Doctors.Include(d => d.User).FirstOrDefaultAsync(d => d.Id == id); 
            if (doctorProfile == null) 
            {
                await LogBothAsync("Delete", "Failed", $"Doctor profile record not found for ID: {id}");
                return NotFound(new { success = false, message = "Doctor profile not found." }); 
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.Doctors.Remove(doctorProfile);
                await _context.SaveChangesAsync();

                if (doctorProfile.User != null)
                {
                    var result = await _userManager.DeleteAsync(doctorProfile.User); 
                    if (!result.Succeeded)
                    {
                        await transaction.RollbackAsync();
                        await LogBothAsync("Delete", "Failed", $"Failed to delete doctor account for ID: {id}");
                        return BadRequest(new { success = false, message = "Delete doctor operation failed." });
                    }
                }

                await transaction.CommitAsync();

                await LogBothAsync("Delete", "Success", $"Deleted Doctor account and profile data (ID: {id}).");
                return Ok(new { success = true, message = "Doctor deleted successfully." }); 
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await LogBothAsync("Delete", "Error", $"Delete failed for doctor ID: {id} - {ex.Message}");
                return BadRequest(new { success = false, message = "System runtime exception occurred on delete." });
            }
        }
    }

    public class DoctorDto 
    {
        [Required(ErrorMessage = "Full name is required.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Full name must be between 2 and 100 characters.")]
        public string FullName { get; set; } = null!; 

        [Required(ErrorMessage = "Email address is required.")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address.")]
        [StringLength(200, ErrorMessage = "Email address must not exceed 200 characters.")]
        public string Email { get; set; } = null!; 

        [RegularExpression(@"^(?:|(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,})$", ErrorMessage = "Password must contain at least one number and one special character (e.g. !@#$) and be at least 8 characters long.")]
        public string? Password { get; set; } 

        public string? ProfileImageUrl { get; set; }

        [Required(ErrorMessage = "Phone number is required.")]
        [RegularExpression(@"^(\+65\d{8}|\+60\d{9,10})$", ErrorMessage = "Phone number must be a valid Singapore (+65, 8 digits) or Malaysia (+60, 9–10 digits) number.")]
        public string Phone { get; set; } = null!; 

        [RegularExpression(@"^(|(\+65\d{8})|(\+60\d{9,10}))$", ErrorMessage = "Alternate phone number must be a valid Singapore (+65, 8 digits) or Malaysia (+60, 9–10 digits) number.")]
        public string? PhoneNumberAlt { get; set; } 

        [Required(ErrorMessage = "Gender selection is required.")]
        public int? GenderId { get; set; } 

        [Required(ErrorMessage = "User Account Status is required.")]
        public int UserStatus { get; set; } = 1; 

        public UserRole Role { get; set; } = UserRole.Doctor;

        [Required(ErrorMessage = "License number is required.")]
        [StringLength(50, ErrorMessage = "License number must not exceed 50 characters.")]
        public string LicenseNumber { get; set; } = null!;

        [Required(ErrorMessage = "Date of birth is required.")]
        [RegularExpression(@"^(|\d{4}-\d{2}-\d{2})$", ErrorMessage = "Date of birth must be in YYYY-MM-DD format.")]
        public string DateOfBirth { get; set; } = null!;

        [Required(ErrorMessage = "Department choice is required.")]
        public int? DepartmentId { get; set; }

        [Required(ErrorMessage = "Specialty choice is required.")]
        public int? SpecialtyId { get; set; }

        [Required(ErrorMessage = "Professional title choice is required.")]
        public int? PositionId { get; set; }

        public int? OfficeLocationId { get; set; }

        [Range(0, 100, ErrorMessage = "Years of experience must be between 0 and 100.")]
        public int? YearsOfExperience { get; set; }

        [Required(ErrorMessage = "Office phone is required.")]
        [RegularExpression(@"^\d{8,11}$", ErrorMessage = "Office phone must contain only numbers and be between 8 and 11 digits.")]
        public string OfficePhone { get; set; } = null!;

        [Required(ErrorMessage = "Date join is required.")]
        [RegularExpression(@"^(|\d{4}-\d{2}-\d{2})$", ErrorMessage = "Date join must be in YYYY-MM-DD format.")]
        public string DateJoin { get; set; } = null!;

        [RegularExpression(@"^(|\d{4}-\d{2}-\d{2})$", ErrorMessage = "Date left must be in YYYY-MM-DD format.")]
        public string? DateLeft { get; set; }

        public int? DoctorStatus { get; set; } 

        public string? Address { get; set; }
        public string? AddressLine2 { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }

        // 强行约束邮编只能是 5位 或 6位 纯数字
        [RegularExpression(@"^(|\d{5,6})$", ErrorMessage = "Postal code must be exactly 5 or 6 digits.")]
        public string? PostalCode { get; set; }
        
        public string? Country { get; set; }
        public string? Qualifications { get; set; }
        public string? Biography { get; set; }
        public string? Remark { get; set; }
    }
}