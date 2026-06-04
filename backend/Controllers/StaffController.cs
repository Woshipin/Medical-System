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
using MedicalSystem.Services; 
using System.IO;
using Microsoft.Extensions.Logging;

namespace MedicalSystem.Controllers 
{
    [Route("api/[controller]")] 
    [ApiController] 
    public class StaffController : ControllerBase 
    {
        private readonly UserManager<User> _userManager; 
        private readonly IActivityLogService _activityLog; 
        private readonly ILogger<StaffController> _logger;

        public StaffController(
            UserManager<User> userManager, 
            IActivityLogService activityLog,
            ILogger<StaffController> logger) 
        {
            _userManager = userManager; 
            _activityLog = activityLog; 
            _logger = logger;
        }

        private async Task LogBothAsync(string actionName, string status, string message)
        {
            _logger.LogInformation("[StaffController.{ActionName}] {Status}: {Message}", actionName, status, message);
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
            var staffs = await _userManager.Users 
                .Include(u => u.Gender) 
                .Where(u => u.Role == UserRole.SuperAdmin || u.Role == UserRole.Admin) 
                .OrderByDescending(u => u.CreatedAt) 
                .ToListAsync(); 

            await LogBothAsync("Read", "Success", $"Retrieved {staffs.Count} staff members data.");
            return Ok(ApiResponse<IEnumerable<User>>.SuccessResponse(staffs, "Staff list retrieved successfully.")); 
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var staff = await _userManager.Users
                .Include(u => u.Gender)
                .FirstOrDefaultAsync(u => u.Id == id && (u.Role == UserRole.SuperAdmin || u.Role == UserRole.Admin));
            
            if (staff == null) 
            {
                await LogBothAsync("Read", "Failed", $"Staff not found for ID: {id}");
                return NotFound(ApiResponse<string>.FailureResponse("Staff not found."));
            }

            await LogBothAsync("Read", "Success", $"Retrieved staff ID: {id}");
            return Ok(ApiResponse<User>.SuccessResponse(staff, "Staff details retrieved successfully."));
        }

        [HttpPost] 
        public async Task<IActionResult> Create([FromBody] StaffDto model) 
        {
            // C# DTO Model Validation
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
                await LogBothAsync("Create", "Failed", "Password is required for new staff.");
                return BadRequest(new { success = false, message = "Password is required.", errors = new Dictionary<string, string> { { "password", "Password is required for creating a new account." } } });
            }

            var existingUser = await _userManager.FindByEmailAsync(model.Email); 
            if (existingUser != null) 
            {
                await LogBothAsync("Create", "Failed", $"Email already exists: {model.Email}");
                return BadRequest(new { success = false, message = "The email address is already taken.", errors = new Dictionary<string, string> { { "email", "This email address is already registered." } } }); 
            }

            if (model.Role != UserRole.SuperAdmin && model.Role != UserRole.Admin)
            {
                await LogBothAsync("Create", "Failed", $"Unauthorized role type assignment: {model.Role}");
                return BadRequest(new { success = false, message = "Unauthorized role type assignment.", errors = (object?)null });
            }

            var savedImagePath = SaveBase64Image(model.ProfileImageUrl);

            var newStaff = new User 
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
                Role = model.Role, 
                Status = model.Status, 
                CreatedAt = DateTime.UtcNow, 
                UpdatedAt = DateTime.UtcNow 
            };

            var result = await _userManager.CreateAsync(newStaff, model.Password); 

            if (result.Succeeded) 
            {
                var details = new List<string>
                {
                    $"• USER ID -> {newStaff.Id}",
                    $"• FULL NAME -> {newStaff.FullName}",
                    $"• EMAIL -> {newStaff.Email}",
                    $"• ROLE -> {newStaff.Role}",
                    $"• DATE OF BIRTH -> {newStaff.DateOfBirth?.ToString("yyyy-MM-dd") ?? "None"}",
                    $"• PHONE -> {newStaff.PhoneNumber ?? "None"}",
                    $"• ALT PHONE -> {newStaff.PhoneNumberAlt ?? "None"}",
                    $"• GENDER ID -> {newStaff.GenderId?.ToString() ?? "None"}",
                    $"• ADDRESS LINE 1 -> {newStaff.AddressLine1 ?? "None"}",
                    $"• ADDRESS LINE 2 -> {newStaff.AddressLine2 ?? "None"}",
                    $"• CITY -> {newStaff.City ?? "None"}",
                    $"• STATE -> {newStaff.State ?? "None"}",
                    $"• POSTAL CODE -> {newStaff.PostalCode ?? "None"}",
                    $"• COUNTRY -> {newStaff.Country ?? "None"}",
                    $"• ACCOUNT STATUS -> {(newStaff.Status == 1 ? "Active" : "Inactive")}"
                };

                await LogBothAsync("Create", "Success", $"Created new Staff account with complete information:\n{string.Join("\n", details)}");
                return Ok(new { success = true, message = "Staff member created successfully.", data = newStaff }); 
            }

            // Group ASP.NET Identity Errors and route them specifically to "password" or "general"
            var identityErrors = result.Errors
                .GroupBy(e => e.Code.Contains("Password") ? "password" : "general")
                .ToDictionary(
                    g => g.Key,
                    g => string.Join(" ", g.Select(e => e.Description))
                );

            await LogBothAsync("Create", "Failed", $"Account creation failed: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            return BadRequest(new { success = false, message = "Account creation failed due to password policy constraints.", errors = identityErrors }); 
        }

        [HttpPut("{id}")] 
        public async Task<IActionResult> Update(int id, [FromBody] StaffDto model) 
        {
            if (!ModelState.IsValid) 
            {
                var fieldErrors = ModelState
                    .Where(x => x.Value != null && x.Value.Errors.Count > 0)
                    .ToDictionary(
                        x => x.Key,
                        x => x.Value!.Errors.First().ErrorMessage
                    );

                await LogBothAsync("Update", "Failed", $"Model validation failed for staff ID: {id}");
                return BadRequest(new { success = false, message = "Please fix the validation errors below.", errors = fieldErrors }); 
            }

            var user = await _userManager.FindByIdAsync(id.ToString()); 
            if (user == null || (user.Role != UserRole.SuperAdmin && user.Role != UserRole.Admin)) 
            {
                await LogBothAsync("Update", "Failed", $"Staff not found for ID: {id}");
                return NotFound(ApiResponse<string>.FailureResponse("Staff not found.")); 
            }

            var changes = new List<string>();

            if (user.FullName != model.FullName)
                changes.Add($"• Full Name -> {user.FullName} ➔ {model.FullName}");

            if (user.Email != model.Email)
            {
                var emailConflict = await _userManager.Users.AnyAsync(u => u.Email == model.Email && u.Id != id);
                if (emailConflict)
                {
                    await LogBothAsync("Update", "Failed", $"Email address already in use: {model.Email}");
                    return BadRequest(new { success = false, message = "Email already in use.", errors = new Dictionary<string, string> { { "email", "This email address is already in use by another user." } } });
                }
                changes.Add($"• Email -> {user.Email} ➔ {model.Email}");
            }

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

            if (user.Role != model.Role)
                changes.Add($"• System Role -> {user.Role} ➔ {model.Role}");

            if (user.Status != model.Status)
                changes.Add($"• Account Status -> {(user.Status == 1 ? "Active" : "Inactive")} ➔ {(model.Status == 1 ? "Active" : "Inactive")}");

            if (!string.IsNullOrEmpty(model.ProfileImageUrl) && model.ProfileImageUrl != user.ProfileImageUrl)
            {
                changes.Add("• Profile Image -> [Modified]");
                user.ProfileImageUrl = SaveBase64Image(model.ProfileImageUrl);
            }

            user.FullName = model.FullName; 
            user.Email = model.Email; 
            user.UserName = model.Email; 
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
            user.Role = model.Role; 
            user.Status = model.Status; 
            user.UpdatedAt = DateTime.UtcNow; 

            var result = await _userManager.UpdateAsync(user); 
            
            if (result.Succeeded && !string.IsNullOrEmpty(model.Password))
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var resetResult = await _userManager.ResetPasswordAsync(user, token, model.Password);
                
                if (!resetResult.Succeeded)
                {
                    // Map ASP.NET Identity errors to the specific password field
                    var passwordErrors = resetResult.Errors
                        .GroupBy(e => e.Code.Contains("Password") ? "password" : "general")
                        .ToDictionary(
                            g => g.Key,
                            g => string.Join(" ", g.Select(e => e.Description))
                        );

                    await LogBothAsync("Update", "Failed", $"Password reset failed for staff ID: {id}");
                    return BadRequest(new { success = false, message = "Password update failed due to complexity requirements.", errors = passwordErrors });
                }
                changes.Add("• Password -> [Modified]");
            }

            if (result.Succeeded) 
            {
                string logDetails = changes.Any() 
                    ? $"Updated Staff details (ID: {id}):\n{string.Join("\n", changes)}" 
                    : $"Updated Staff details (ID: {id}):\n• No fields were modified."; 

                await LogBothAsync("Update", "Success", logDetails); 
                return Ok(new { success = true, message = "Staff member updated successfully." }); 
            }
            
            await LogBothAsync("Update", "Failed", $"Update failed for staff ID: {id}");
            return BadRequest(new { success = false, message = "Update failed due to system errors." }); 
        }

        [HttpDelete("{id}")] 
        public async Task<IActionResult> Delete(int id) 
        {
            var user = await _userManager.FindByIdAsync(id.ToString()); 
            if (user == null || (user.Role != UserRole.SuperAdmin && user.Role != UserRole.Admin)) 
            {
                await LogBothAsync("Delete", "Failed", $"Staff not found for ID: {id}");
                return NotFound(ApiResponse<string>.FailureResponse("Staff not found.")); 
            }

            var result = await _userManager.DeleteAsync(user); 
            if (result.Succeeded) 
            {
                var deletedDetails = new List<string>
                {
                    $"• USER ID -> {user.Id}",
                    $"• FULL NAME -> {user.FullName}",
                    $"• EMAIL -> {user.Email}",
                    $"• ROLE -> {user.Role}",
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
                    $"• STATUS -> {(user.Status == 1 ? "Active" : "Inactive")}"
                };

                await LogBothAsync("Delete", "Success", $"Deleted Staff account and associated records:\n{string.Join("\n", deletedDetails)}");
                return Ok(new { success = true, message = "Staff member deleted successfully." }); 
            }
            
            await LogBothAsync("Delete", "Failed", $"Failed to delete staff ID: {id}");
            return BadRequest(new { success = false, message = "Delete failed." }); 
        }
    }

    public class StaffDto 
    {
        [Required(ErrorMessage = "Full name is required.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Full name must be between 2 and 100 characters.")]
        public string FullName { get; set; } = null!; 

        [Required(ErrorMessage = "Email address is required.")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address.")]
        [StringLength(200, ErrorMessage = "Email address must not exceed 200 characters.")]
        public string Email { get; set; } = null!; 

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

        [Required(ErrorMessage = "System role is required.")]
        public UserRole Role { get; set; } 

        [Required(ErrorMessage = "Status is required.")]
        public int Status { get; set; } = 1; 
    }
}