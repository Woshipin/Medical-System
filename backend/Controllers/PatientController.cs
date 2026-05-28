using System; 
using System.Collections.Generic; 
using System.Linq; 
using System.Threading.Tasks; 
using Microsoft.AspNetCore.Authorization; 
using Microsoft.AspNetCore.Identity; 
using Microsoft.AspNetCore.Mvc; 
using Microsoft.EntityFrameworkCore; 
using MedicalSystem.Models; 
using MedicalSystem.Data;
using MedicalSystem.Services; 
using System.IO; // 引入命名空间

namespace MedicalSystem.Controllers 
{
    [Route("api/[controller]")] 
    [ApiController] 
    public class PatientController : ControllerBase 
    {
        private readonly UserManager<User> _userManager; 
        private readonly AppDbContext _context;
        private readonly IActivityLogService _activityLog; 

        public PatientController(UserManager<User> userManager, AppDbContext context, IActivityLogService activityLog) 
        {
            _userManager = userManager; 
            _context = context;
            _activityLog = activityLog; 
        }

        // 新增：安全保存 Base64 编码的患者头像图片至本地 user-image 文件夹
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
            // 仅提取 Role 是 Patient (3) 的用户并关联 PatientProfile 档案
            var patients = await _userManager.Users 
                .Include(u => u.Gender) 
                .Include(u => u.PatientProfile) 
                .Where(u => u.Role == UserRole.Patient) 
                .OrderByDescending(u => u.CreatedAt) 
                .ToListAsync(); 

            return Ok(ApiResponse<IEnumerable<User>>.SuccessResponse(patients, "Patient list retrieved successfully.")); 
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var patient = await _userManager.Users
                .Include(u => u.Gender)
                .Include(u => u.PatientProfile)
                .FirstOrDefaultAsync(u => u.Id == id && u.Role == UserRole.Patient);
            
            if (patient == null) 
                return NotFound(ApiResponse<string>.FailureResponse("Patient not found."));

            return Ok(ApiResponse<User>.SuccessResponse(patient, "Patient details retrieved successfully."));
        }

        [HttpPost] 
        public async Task<IActionResult> Create([FromBody] PatientDto model) 
        {
            if (!ModelState.IsValid) 
                return BadRequest(ApiResponse<string>.FailureResponse("Invalid data provided.")); 

            var existingUser = await _userManager.FindByEmailAsync(model.Email); 
            if (existingUser != null) 
                return BadRequest(ApiResponse<string>.FailureResponse("Email already exists.")); 

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 保存患者头像到本地文件夹并写入相对路径
                var savedImagePath = SaveBase64Image(model.ProfileImageUrl);

                var newPatient = new User 
                {
                    UserName = model.Email, 
                    Email = model.Email, 
                    FullName = model.FullName, 
                    ProfileImageUrl = savedImagePath, // 本地图像相对路径
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

                var result = await _userManager.CreateAsync(newPatient, model.Password ?? string.Empty); 

                if (!result.Succeeded)
                {
                    return BadRequest(ApiResponse<string>.FailureResponse(string.Join(", ", result.Errors.Select(e => e.Description)))); 
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

                await _activityLog.LogAsync("Created", $"Created new Patient account:\n• ID -> {newPatient.Id}\n• Name -> {newPatient.FullName}");
                return Ok(ApiResponse<User>.SuccessResponse(newPatient, "Patient created successfully.")); 
            }
            catch(Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ApiResponse<string>.FailureResponse("Failed to create patient: " + ex.Message));
            }
        }

        [HttpPut("{id}")] 
        public async Task<IActionResult> Update(int id, [FromBody] PatientDto model) 
        {
            var user = await _userManager.Users.Include(u => u.PatientProfile).FirstOrDefaultAsync(u => u.Id == id);
            
            if (user == null || user.Role != UserRole.Patient) 
                return NotFound(ApiResponse<string>.FailureResponse("Patient not found.")); 

            // 如果更新了患者头像，重新保存到本地并替换为路径
            if (!string.IsNullOrEmpty(model.ProfileImageUrl) && model.ProfileImageUrl != user.ProfileImageUrl)
            {
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
            user.Status = model.Status; 
            user.UpdatedAt = DateTime.UtcNow; 

            if (!string.IsNullOrEmpty(model.Password))
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                await _userManager.ResetPasswordAsync(user, token, model.Password);
            }

            if (user.PatientProfile == null)
            {
                user.PatientProfile = new PatientProfile 
                { 
                    UserId = user.Id, 
                    CreatedAt = DateTime.UtcNow 
                };
                _context.PatientProfiles.Add(user.PatientProfile);
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
            await _activityLog.LogAsync("Updated", $"Updated Patient details (ID: {id}, Name: {user.FullName})"); 

            return Ok(ApiResponse<string>.SuccessResponse(null, "Patient updated successfully.")); 
        }

        [HttpDelete("{id}")] 
        public async Task<IActionResult> Delete(int id) 
        {
            var user = await _userManager.Users.Include(u => u.PatientProfile).FirstOrDefaultAsync(u => u.Id == id); 
            if (user == null || user.Role != UserRole.Patient) 
                return NotFound(ApiResponse<string>.FailureResponse("Patient not found.")); 

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 先主动清理患者关联数据
                if (user.PatientProfile != null)
                {
                    _context.PatientProfiles.Remove(user.PatientProfile);
                    await _context.SaveChangesAsync();
                }

                var result = await _userManager.DeleteAsync(user); 
                if (!result.Succeeded)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(ApiResponse<string>.FailureResponse(string.Join(", ", result.Errors.Select(e => e.Description))));
                }

                await transaction.CommitAsync();
                await _activityLog.LogAsync("Deleted", $"Deleted Patient account & profile:\n• ID -> {user.Id}\n• Name -> {user.FullName}");
                return Ok(ApiResponse<string>.SuccessResponse(null, "Patient deleted successfully.")); 
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ApiResponse<string>.FailureResponse("Delete failed: " + ex.Message));
            }
        }
    }

    // 在此补全 DTO 定义
    public class PatientDto 
    {
        public string FullName { get; set; } = null!; 
        public string Email { get; set; } = null!; 
        public string? Password { get; set; } 
        public string? ProfileImageUrl { get; set; }
        public string? DateOfBirth { get; set; } 
        public string? PhoneNumber { get; set; } 
        public string? PhoneNumberAlt { get; set; } 
        public int? GenderId { get; set; } 
        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }
        public int Status { get; set; } = 1; 

        public string? IcNumber { get; set; }
        public string? BloodType { get; set; }
        public string? Allergies { get; set; }
        public string? ChronicDiseases { get; set; }
        public string? MedicalNotes { get; set; }
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactPhone { get; set; }
        public string? EmergencyContactRelation { get; set; }
    }
}