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
    public class PatientController : ControllerBase 
    {
        private readonly UserManager<User> _userManager; 
        private readonly AppDbContext _context;
        private readonly IActivityLogService _activityLog; 
        private readonly ILogger<PatientController> _logger;

        public PatientController(
            UserManager<User> userManager, 
            AppDbContext context, 
            IActivityLogService activityLog,
            ILogger<PatientController> logger) 
        {
            _userManager = userManager; 
            _context = context;
            _activityLog = activityLog; 
            _logger = logger;
        }

        private async Task LogBothAsync(string actionName, string status, string message)
        {
            _logger.LogInformation("[PatientController.{ActionName}] {Status}: {Message}", actionName, status, message);
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
            var patients = await _context.Users 
                .Include(u => u.Gender) 
                .Include(u => u.PatientProfile) 
                .Where(u => u.Role == UserRole.Patient) 
                .OrderByDescending(u => u.CreatedAt) 
                .ToListAsync(); 

            await LogBothAsync("Read", "Success", $"Retrieved {patients.Count} patients data.");
            return Ok(ApiResponse<IEnumerable<User>>.SuccessResponse(patients, "Patient list retrieved successfully.")); 
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var patient = await _context.Users
                .Include(u => u.Gender)
                .Include(u => u.PatientProfile)
                .FirstOrDefaultAsync(u => u.Id == id && u.Role == UserRole.Patient);
            
            if (patient == null) 
            {
                await LogBothAsync("Read", "Failed", $"Patient not found for ID: {id}");
                return NotFound(ApiResponse<string>.FailureResponse("Patient not found."));
            }

            await LogBothAsync("Read", "Success", $"Retrieved patient ID: {id}");
            return Ok(ApiResponse<User>.SuccessResponse(patient, "Patient details retrieved successfully."));
        }

        [HttpPost] 
        public async Task<IActionResult> Create([FromBody] PatientDto model) 
        {
            // C# DTO Validation Gate
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
                await LogBothAsync("Create", "Failed", "Password is required for new patients.");
                return BadRequest(new { success = false, message = "Password is required.", errors = new Dictionary<string, string> { { "password", "Password is required for creating a new patient account." } } });
            }

            var existingUser = await _userManager.FindByEmailAsync(model.Email); 
            if (existingUser != null) 
            {
                await LogBothAsync("Create", "Failed", $"Email already exists: {model.Email}");
                return BadRequest(new { success = false, message = "The email address is already taken.", errors = new Dictionary<string, string> { { "email", "This email address is already registered." } } }); 
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var savedImagePath = SaveBase64Image(model.ProfileImageUrl);

                var newPatient = new User 
                {
                    UserName = model.Email, 
                    Email = model.Email, 
                    FullName = model.FullName, 
                    ProfileImageUrl = savedImagePath, 
                    DateOfBirth = string.IsNullOrEmpty(model.DateOfBirth) ? null : DateOnly.Parse(model.DateOfBirth),
                    PhoneNumber = model.PhoneNumber, 
                    PhoneNumberAlt = model.PhoneNumberAlt,
                    GenderId = model.GenderId, 
                    AddressLine1 = model.AddressLine1,
                    AddressLine2 = model.AddressLine2,
                    City = model.City,
                    State = model.State,
                    PostalCode = model.PostalCode,
                    Country = model.Country,
                    Role = UserRole.Patient, 
                    Status = model.Status, 
                    CreatedAt = DateTime.UtcNow, 
                    UpdatedAt = DateTime.UtcNow 
                };

                var result = await _userManager.CreateAsync(newPatient, model.Password); 

                if (!result.Succeeded)
                {
                    // Map ASP.NET Identity validation errors to specific password field
                    var identityErrors = result.Errors
                        .GroupBy(e => e.Code.Contains("Password") ? "password" : "general")
                        .ToDictionary(
                            g => g.Key,
                            g => string.Join(" ", g.Select(e => e.Description))
                        );

                    await LogBothAsync("Create", "Failed", $"Failed to create patient account for {model.Email}");
                    return BadRequest(new { success = false, message = "Account creation failed due to password policy constraints.", errors = identityErrors }); 
                }

                var profile = new PatientProfile
                {
                    UserId = newPatient.Id,
                    IcNumber = model.IcNumber,
                    BloodType = model.BloodType,
                    Allergies = model.Allergies,
                    ChronicDiseases = model.ChronicDiseases,
                    MedicalNotes = model.MedicalNotes,
                    EmergencyContactName = model.EmergencyContactName,
                    EmergencyContactPhone = model.EmergencyContactPhone,
                    EmergencyContactRelation = model.EmergencyContactRelation,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.PatientProfiles.Add(profile);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var details = new List<string>
                {
                    $"• USER ID -> {newPatient.Id}",
                    $"• FULL NAME -> {newPatient.FullName}",
                    $"• EMAIL -> {newPatient.Email}",
                    $"• DATE OF BIRTH -> {newPatient.DateOfBirth?.ToString("yyyy-MM-dd") ?? "None"}",
                    $"• PHONE -> {newPatient.PhoneNumber ?? "None"}",
                    $"• ALT PHONE -> {newPatient.PhoneNumberAlt ?? "None"}",
                    $"• GENDER ID -> {newPatient.GenderId?.ToString() ?? "None"}",
                    $"• ADDRESS LINE 1 -> {newPatient.AddressLine1 ?? "None"}",
                    $"• ADDRESS LINE 2 -> {newPatient.AddressLine2 ?? "None"}",
                    $"• CITY -> {newPatient.City ?? "None"}",
                    $"• STATE -> {newPatient.State ?? "None"}",
                    $"• POSTAL CODE -> {newPatient.PostalCode ?? "None"}",
                    $"• COUNTRY -> {newPatient.Country ?? "None"}",
                    $"• ACCOUNT STATUS -> {(newPatient.Status == 1 ? "Active" : "Inactive")}",
                    $"• IC NUMBER -> {profile.IcNumber ?? "None"}",
                    $"• BLOOD TYPE -> {profile.BloodType ?? "None"}",
                    $"• ALLERGIES -> {profile.Allergies ?? "None"}",
                    $"• CHRONIC DISEASES -> {profile.ChronicDiseases ?? "None"}",
                    $"• MEDICAL NOTES -> {profile.MedicalNotes ?? "None"}",
                    $"• EMERGENCY CONTACT NAME -> {profile.EmergencyContactName ?? "None"}",
                    $"• EMERGENCY CONTACT PHONE -> {profile.EmergencyContactPhone ?? "None"}",
                    $"• EMERGENCY CONTACT RELATION -> {profile.EmergencyContactRelation ?? "None"}"
                };

                await LogBothAsync("Create", "Success", $"Created new Patient account and profile with complete information:\n{string.Join("\n", details)}");
                return Ok(new { success = true, message = "Patient created successfully.", data = newPatient }); 
            }
            catch(Exception ex)
            {
                await transaction.RollbackAsync();
                await LogBothAsync("Create", "Error", $"Failed to create patient: {ex.Message}");
                return BadRequest(new { success = false, message = "System exception error during creation." });
            }
        }

        [HttpPut("{id}")] 
        public async Task<IActionResult> Update(int id, [FromBody] PatientDto model) 
        {
            if (!ModelState.IsValid) 
            {
                var fieldErrors = ModelState
                    .Where(x => x.Value != null && x.Value.Errors.Count > 0)
                    .ToDictionary(
                        x => x.Key,
                        x => x.Value!.Errors.First().ErrorMessage
                    );

                await LogBothAsync("Update", "Failed", $"Model validation failed for patient ID: {id}");
                return BadRequest(new { success = false, message = "Please fix the validation errors below.", errors = fieldErrors }); 
            }

            var user = await _context.Users.Include(u => u.PatientProfile).FirstOrDefaultAsync(u => u.Id == id && u.Role == UserRole.Patient);
            
            if (user == null) 
            {
                await LogBothAsync("Update", "Failed", $"Patient not found for ID: {id}");
                return NotFound(ApiResponse<string>.FailureResponse("Patient not found.")); 
            }

            if (!string.IsNullOrWhiteSpace(model.Email) && model.Email != user.Email) {
                var existingUser = await _userManager.FindByEmailAsync(model.Email); 
                if (existingUser != null && existingUser.Id != user.Id) {
                    await LogBothAsync("Update", "Failed", $"Email address already taken: {model.Email}");
                    return BadRequest(new { success = false, message = "Email already in use.", errors = new Dictionary<string, string> { { "email", "This email address is already taken by another user." } } });
                }
                user.Email = model.Email; 
                user.UserName = model.Email;
                user.NormalizedEmail = model.Email.ToUpperInvariant();
                user.NormalizedUserName = model.Email.ToUpperInvariant();
            }

            var changes = new List<string>();

            if (user.FullName != model.FullName)
                changes.Add($"• Full Name -> {user.FullName} ➔ {model.FullName}");

            if (user.Email != model.Email)
                changes.Add($"• Email -> {user.Email} ➔ {model.Email}");

            var inputDob = string.IsNullOrEmpty(model.DateOfBirth) ? (DateOnly?)null : DateOnly.Parse(model.DateOfBirth);
            if (user.DateOfBirth != inputDob)
                changes.Add($"• Date of Birth -> {user.DateOfBirth?.ToString("yyyy-MM-dd") ?? "None"} ➔ {inputDob?.ToString("yyyy-MM-dd") ?? "None"}");

            if (user.PhoneNumber != model.PhoneNumber)
                changes.Add($"• Phone -> {user.PhoneNumber ?? "None"} ➔ {model.PhoneNumber ?? "None"}");

            if (user.PhoneNumberAlt != model.PhoneNumberAlt)
                changes.Add($"• Alt Phone -> {user.PhoneNumberAlt ?? "None"} ➔ {model.PhoneNumberAlt ?? "None"}");

            if (user.GenderId != model.GenderId)
                changes.Add($"• Gender ID -> {user.GenderId?.ToString() ?? "None"} ➔ {model.GenderId?.ToString() ?? "None"}");

            if (user.AddressLine1 != model.AddressLine1)
                changes.Add($"• Address Line 1 -> {user.AddressLine1 ?? "None"} ➔ {model.AddressLine1 ?? "None"}");

            if (user.AddressLine2 != model.AddressLine2)
                changes.Add($"• Address Line 2 -> {user.AddressLine2 ?? "None"} ➔ {model.AddressLine2 ?? "None"}");

            if (user.City != model.City)
                changes.Add($"• City -> {user.City ?? "None"} ➔ {model.City ?? "None"}");

            if (user.State != model.State)
                changes.Add($"• State -> {user.State ?? "None"} ➔ {model.State ?? "None"}");

            if (user.PostalCode != model.PostalCode)
                changes.Add($"• Postal Code -> {user.PostalCode ?? "None"} ➔ {model.PostalCode ?? "None"}");

            if (user.Country != model.Country)
                changes.Add($"• Country -> {user.Country ?? "None"} ➔ {model.Country ?? "None"}");

            if (user.Status != model.Status)
                changes.Add($"• Account Status -> {(user.Status == 1 ? "Active" : "Inactive")} ➔ {(model.Status == 1 ? "Active" : "Inactive")}");

            if (user.PatientProfile != null)
            {
                if (user.PatientProfile.IcNumber != model.IcNumber)
                    changes.Add($"• IC Number -> {user.PatientProfile.IcNumber ?? "None"} ➔ {model.IcNumber ?? "None"}");

                if (user.PatientProfile.BloodType != model.BloodType)
                    changes.Add($"• Blood Type -> {user.PatientProfile.BloodType ?? "None"} ➔ {model.BloodType ?? "None"}");

                if (user.PatientProfile.Allergies != model.Allergies)
                    changes.Add($"• Allergies -> {user.PatientProfile.Allergies ?? "None"} ➔ {model.Allergies ?? "None"}");

                if (user.PatientProfile.ChronicDiseases != model.ChronicDiseases)
                    changes.Add($"• Chronic Diseases -> {user.PatientProfile.ChronicDiseases ?? "None"} ➔ {model.ChronicDiseases ?? "None"}");

                if (user.PatientProfile.MedicalNotes != model.MedicalNotes)
                    changes.Add($"• Medical Notes -> {user.PatientProfile.MedicalNotes ?? "None"} ➔ {model.MedicalNotes ?? "None"}");

                if (user.PatientProfile.EmergencyContactName != model.EmergencyContactName)
                    changes.Add($"• Emergency Contact Name -> {user.PatientProfile.EmergencyContactName ?? "None"} ➔ {model.EmergencyContactName ?? "None"}");

                if (user.PatientProfile.EmergencyContactPhone != model.EmergencyContactPhone)
                    changes.Add($"• Emergency Contact Phone -> {user.PatientProfile.EmergencyContactPhone ?? "None"} ➔ {model.EmergencyContactPhone ?? "None"}");

                if (user.PatientProfile.EmergencyContactRelation != model.EmergencyContactRelation)
                    changes.Add($"• Emergency Contact Relation -> {user.PatientProfile.EmergencyContactRelation ?? "None"} ➔ {model.EmergencyContactRelation ?? "None"}");
            }

            if (!string.IsNullOrEmpty(model.ProfileImageUrl) && model.ProfileImageUrl != user.ProfileImageUrl)
            {
                changes.Add("• Profile Image -> [Modified]");
                user.ProfileImageUrl = SaveBase64Image(model.ProfileImageUrl);
            }

            user.FullName = model.FullName; 
            user.DateOfBirth = string.IsNullOrEmpty(model.DateOfBirth) ? null : DateOnly.Parse(model.DateOfBirth);
            user.PhoneNumber = model.PhoneNumber; 
            user.PhoneNumberAlt = model.PhoneNumberAlt;
            user.GenderId = model.GenderId; 
            user.AddressLine1 = model.AddressLine1;
            user.AddressLine2 = model.AddressLine2;
            user.City = model.City;
            user.State = model.State;
            user.PostalCode = model.PostalCode;
            user.Country = model.Country;
            user.Status = model.Status; 
            user.UpdatedAt = DateTime.UtcNow; 

            if (!string.IsNullOrEmpty(model.Password))
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var pwdResult = await _userManager.ResetPasswordAsync(user, token, model.Password);
                if (!pwdResult.Succeeded) 
                {
                    var passwordErrors = pwdResult.Errors
                        .GroupBy(e => e.Code.Contains("Password") ? "password" : "general")
                        .ToDictionary(
                            g => g.Key,
                            g => string.Join(" ", g.Select(e => e.Description))
                        );

                    await LogBothAsync("Update", "Failed", $"Failed to update password for patient ID: {id}");
                    return BadRequest(new { success = false, message = "Password update failed due to complexity requirements.", errors = passwordErrors });
                }
                changes.Add("• Password -> [Modified]");
            }

            if (user.PatientProfile == null)
            {
                await LogBothAsync("Update", "Failed", $"Security Error: Linked Patient profile missing for ID: {id}");
                return BadRequest(ApiResponse<string>.FailureResponse("Security Error: Linked Patient profile record does not exist. Update aborted."));
            }

            user.PatientProfile.IcNumber = model.IcNumber;
            user.PatientProfile.BloodType = model.BloodType;
            user.PatientProfile.Allergies = model.Allergies;
            user.PatientProfile.ChronicDiseases = model.ChronicDiseases;
            user.PatientProfile.MedicalNotes = model.MedicalNotes;
            user.PatientProfile.EmergencyContactName = model.EmergencyContactName;
            user.PatientProfile.EmergencyContactPhone = model.EmergencyContactPhone;
            user.PatientProfile.EmergencyContactRelation = model.EmergencyContactRelation;
            user.PatientProfile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            string logDetails = changes.Any() 
                ? $"Updated Patient details (ID: {id}):\n{string.Join("\n", changes)}" 
                : $"Updated Patient details (ID: {id}):\n• No fields were modified."; 

            await LogBothAsync("Update", "Success", logDetails); 

            return Ok(new { success = true, message = "Patient profile updated successfully." }); 
        }

        [HttpDelete("{id}")] 
        public async Task<IActionResult> Delete(int id) 
        {
            var user = await _context.Users.Include(u => u.PatientProfile).FirstOrDefaultAsync(u => u.Id == id && u.Role == UserRole.Patient); 
            if (user == null) 
            {
                await LogBothAsync("Delete", "Failed", $"Patient not found for ID: {id}");
                return NotFound(ApiResponse<string>.FailureResponse("Patient not found.")); 
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (user.PatientProfile != null)
                {
                    _context.PatientProfiles.Remove(user.PatientProfile);
                    await _context.SaveChangesAsync();
                }

                var result = await _userManager.DeleteAsync(user); 
                if (!result.Succeeded)
                {
                    await transaction.RollbackAsync();
                    await LogBothAsync("Delete", "Failed", $"Failed to delete patient ID: {id}");
                    return BadRequest(new { success = false, message = "Delete patient operation failed." });
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
                    $"• ACCOUNT STATUS -> {(user.Status == 1 ? "Active" : "Inactive")}"
                };

                if (user.PatientProfile != null)
                {
                    deletedDetails.Add($"• IC NUMBER -> {user.PatientProfile.IcNumber ?? "None"}");
                    deletedDetails.Add($"• BLOOD TYPE -> {user.PatientProfile.BloodType ?? "None"}");
                    deletedDetails.Add($"• ALLERGIES -> {user.PatientProfile.Allergies ?? "None"}");
                    deletedDetails.Add($"• CHRONIC DISEASES -> {user.PatientProfile.ChronicDiseases ?? "None"}");
                    deletedDetails.Add($"• MEDICAL NOTES -> {user.PatientProfile.MedicalNotes ?? "None"}");
                    deletedDetails.Add($"• EMERGENCY CONTACT NAME -> {user.PatientProfile.EmergencyContactName ?? "None"}");
                    deletedDetails.Add($"• EMERGENCY CONTACT PHONE -> {user.PatientProfile.EmergencyContactPhone ?? "None"}");
                    deletedDetails.Add($"• EMERGENCY CONTACT RELATION -> {user.PatientProfile.EmergencyContactRelation ?? "None"}");
                }

                await LogBothAsync("Delete", "Success", $"Deleted Patient account and associated records:\n{string.Join("\n", deletedDetails)}");
                return Ok(new { success = true, message = "Patient deleted successfully." }); 
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await LogBothAsync("Delete", "Error", $"Delete failed for patient ID: {id} - {ex.Message}");
                return BadRequest(new { success = false, message = "System runtime exception occurred on delete." });
            }
        }
    }

    public class PatientDto 
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

        [RegularExpression(@"^(|\d{4}-\d{2}-\d{2})$", ErrorMessage = "Date of birth must be in YYYY-MM-DD format.")]
        public string? DateOfBirth { get; set; } 

        [Required(ErrorMessage = "Phone number is required.")]
        [RegularExpression(@"^(\+65\d{8}|\+60\d{9,10})$", ErrorMessage = "Phone number must be a valid Singapore (+65, 8 digits) or Malaysia (+60, 9–10 digits) number.")]
        public string? PhoneNumber { get; set; } 

        [RegularExpression(@"^(|(\+65\d{8})|(\+60\d{9,10}))$", ErrorMessage = "Alternate phone number must be a valid Singapore (+65, 8 digits) or Malaysia (+60, 9–10 digits) number.")]
        public string? PhoneNumberAlt { get; set; } 

        [Required(ErrorMessage = "Gender selection is required.")]
        public int? GenderId { get; set; } 

        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }

        [RegularExpression(@"^(|\d{5,6})$", ErrorMessage = "Postal code must be 5 or 6 digits.")]
        public string? PostalCode { get; set; }
        public string? Country { get; set; }

        [Required(ErrorMessage = "Status is required.")]
        public int Status { get; set; } = 1; 

        [Required(ErrorMessage = "IC/ID number is required.")]
        [StringLength(30, MinimumLength = 5, ErrorMessage = "IC/ID number must be between 5 and 30 characters.")]
        public string? IcNumber { get; set; }

        [Required(ErrorMessage = "Blood type is required.")]
        public string? BloodType { get; set; }

        public string? Allergies { get; set; }
        public string? ChronicDiseases { get; set; }
        public string? MedicalNotes { get; set; }

        [Required(ErrorMessage = "Emergency contact name is required.")]
        [StringLength(100, ErrorMessage = "Emergency contact name must not exceed 100 characters.")]
        public string? EmergencyContactName { get; set; }

        [Required(ErrorMessage = "Emergency contact phone is required.")]
        [RegularExpression(@"^(\+65\d{8}|\+60\d{9,10})$", ErrorMessage = "Emergency contact phone must be a valid Singapore (+65, 8 digits) or Malaysia (+60, 9–10 digits) number.")]
        public string? EmergencyContactPhone { get; set; }

        [Required(ErrorMessage = "Emergency contact relationship is required.")]
        [StringLength(50, ErrorMessage = "Relationship details must not exceed 50 characters.")]
        public string? EmergencyContactRelation { get; set; }
    }
}