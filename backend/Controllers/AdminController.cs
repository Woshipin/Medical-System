using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MedicalSystem.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;
using MedicalSystem.Services;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.ComponentModel.DataAnnotations;

namespace MedicalSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly IConfiguration _configuration;
        private readonly IActivityLogService _activityLog;
        private readonly Data.AppDbContext _context;
        private readonly ILogger<AdminController> _logger;

        public AdminController(
            UserManager<User> userManager,
            IConfiguration configuration,
            IActivityLogService activityLog,
            Data.AppDbContext context,
            ILogger<AdminController> logger)
        {
            _userManager = userManager;
            _configuration = configuration;
            _activityLog = activityLog;
            _context = context;
            _logger = logger;
        }

        private async Task LogBothAsync(string functionName, string status, string message, int? userId = null, string userName = "Anonymous", string role = "System")
        {
            _logger.LogInformation("[AdminController.{FunctionName}] {Status}: {Message}", functionName, status, message);
            await _activityLog.LogExplicitAsync(userId, userName, role, functionName, $"[{status}] {message}");
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] AdminRegisterDto model)
        {
            // ── Step 1: ModelState validation (Data Annotations on DTO) ──────────────
            if (!ModelState.IsValid)
            {
                // Collect all field-level errors into a flat dictionary { "FieldName": "First error message" }
                var fieldErrors = ModelState
                    .Where(x => x.Value != null && x.Value.Errors.Count > 0)
                    .ToDictionary(
                        x => x.Key,
                        x => x.Value!.Errors.First().ErrorMessage
                    );

                await LogBothAsync("Register", "Failed", $"Validation failed for email {model.Email}: {string.Join(", ", fieldErrors.Select(e => $"{e.Key}: {e.Value}"))}");
                return BadRequest(new
                {
                    success = false,
                    message = "Please fix the validation errors below.",
                    errors = fieldErrors
                });
            }

            // ── Step 2: Role validation ───────────────────────────────────────────────
            if (!Enum.TryParse<UserRole>(model.Role, true, out var userRole))
            {
                await LogBothAsync("Register", "Failed", $"Invalid role '{model.Role}' for email {model.Email}");
                return BadRequest(new
                {
                    success = false,
                    message = $"'{model.Role}' is not a valid system role. Accepted values: SuperAdmin, Admin, Doctor.",
                    errors = (object?)null
                });
            }

            // ── Step 3: Duplicate email check ─────────────────────────────────────────
            var existingUser = await _userManager.FindByEmailAsync(model.Email);
            if (existingUser != null)
            {
                await LogBothAsync("Register", "Failed", $"Email already exists: {model.Email}");
                return BadRequest(new
                {
                    success = false,
                    message = $"The email address '{model.Email}' is already registered. Please use a different email.",
                    errors = new Dictionary<string, string> { { "Email", $"'{model.Email}' is already taken." } }
                });
            }

            // ── Step 4: Create user ───────────────────────────────────────────────────
            var user = new User
            {
                UserName = model.Email,
                Email = model.Email,
                FullName = model.FullName,
                PhoneNumber = model.PhoneNumber,
                Role = userRole,
                GenderId = 1,
                Status = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var result = await _userManager.CreateAsync(user, model.Password);
                if (!result.Succeeded)
                {
                    // Map ASP.NET Identity password errors into a field-level errors dict
                    var identityErrors = result.Errors
                        .GroupBy(e => e.Code.Contains("Password") ? "Password" : "General")
                        .ToDictionary(
                            g => g.Key,
                            g => string.Join(" ", g.Select(e => e.Description))
                        );

                    var firstError = result.Errors.First().Description;
                    await LogBothAsync("Register", "Failed", $"Account creation failed: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                    return BadRequest(new
                    {
                        success = false,
                        message = firstError,
                        errors = identityErrors
                    });
                }

                if (userRole == UserRole.Patient)
                {
                    var profile = new PatientProfile
                    {
                        UserId = user.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.PatientProfiles.Add(profile);
                }
                else if (userRole == UserRole.Doctor)
                {
                    var doctor = new Doctor
                    {
                        UserId = user.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.Doctors.Add(doctor);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                await LogBothAsync(
                    "Register", "Success",
                    $"Created new staff account - User ID: {user.Id}, Full Name: {user.FullName}, Email: {user.Email}, Role: {user.Role}",
                    user.Id, user.FullName, user.Role.ToString()
                );

                return Ok(new
                {
                    success = true,
                    message = $"Account created successfully! Welcome, {user.FullName}. You can now log in.",
                    errors = (object?)null
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await LogBothAsync("Register", "Error", $"Relative Profile mapping failed to save: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An unexpected error occurred while creating your account. Please try again.",
                    errors = (object?)null
                });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AdminLoginDto model)
        {
            // ── Step 1: ModelState validation ─────────────────────────────────────────
            if (!ModelState.IsValid)
            {
                var fieldErrors = ModelState
                    .Where(x => x.Value != null && x.Value.Errors.Count > 0)
                    .ToDictionary(
                        x => x.Key,
                        x => x.Value!.Errors.First().ErrorMessage
                    );

                await LogBothAsync("Login", "Failed", $"Validation failed: {string.Join(", ", fieldErrors.Select(e => $"{e.Key}: {e.Value}"))}");
                return BadRequest(new
                {
                    success = false,
                    message = "Please fix the validation errors below.",
                    errors = fieldErrors
                });
            }

            // ── Step 2: Credential check ──────────────────────────────────────────────
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
            {
                await LogBothAsync("Login", "Failed", $"Failed admin portal login attempt - AttemptedEmail: '{model.Email}'");
                return Unauthorized(new
                {
                    success = false,
                    message = "Incorrect email or password. Please double-check your credentials and try again.",
                    errors = (object?)null
                });
            }

            // ── Step 3: Block patient logins on admin portal ──────────────────────────
            if (user.Role == UserRole.Patient)
            {
                await LogBothAsync("Login", "Failed",
                    $"Blocked patient login attempt on admin portal - Email: '{user.Email}'",
                    user.Id, user.FullName, "Patient");
                return Unauthorized(new
                {
                    success = false,
                    message = "Access denied. Patient accounts are not permitted to access the admin portal. Please use the patient portal instead.",
                    errors = (object?)null
                });
            }

            // ── Step 4: Issue token ───────────────────────────────────────────────────
            var token = GenerateJwtToken(user);

            await LogBothAsync(
                "Login", "Success",
                $"Logged into the admin portal - Email: {user.Email}, Role: {user.Role}",
                user.Id, user.FullName, user.Role.ToString()
            );

            return Ok(new
            {
                success = true,
                message = $"Welcome back, {user.FullName}! You have successfully logged in.",
                errors = (object?)null,
                data = new
                {
                    token = token,
                    user = new
                    {
                        id = user.Id.ToString(),
                        fullName = user.FullName,
                        email = user.Email,
                        Role = user.Role.ToString()?.ToLower()
                    }
                }
            });
        }

        [HttpGet("check-auth")]
        [Authorize]
        public async Task<IActionResult> CheckAuth()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            var user = await _userManager.FindByIdAsync(userIdStr!);

            if (user == null || user.Status != 1 || user.Role == UserRole.Patient)
            {
                await LogBothAsync("CheckAuth", "Failed", $"Invalid or unauthorized token access attempt. UserID: {userIdStr}");
                return Unauthorized(new
                {
                    success = false,
                    message = "Your session is invalid or has expired. Please log in again.",
                    errors = (object?)null
                });
            }

            await LogBothAsync("CheckAuth", "Success", $"Token validated for Admin {user.Email}", user.Id, user.FullName, user.Role.ToString());

            return Ok(new
            {
                success = true,
                message = "Authentication valid.",
                errors = (object?)null,
                data = new
                {
                    user = new
                    {
                        id = user.Id.ToString(),
                        fullName = user.FullName,
                        email = user.Email,
                        Role = user.Role.ToString()?.ToLower()
                    }
                }
            });
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!string.IsNullOrEmpty(userIdStr))
            {
                var user = await _userManager.FindByIdAsync(userIdStr);
                if (user != null)
                {
                    await LogBothAsync("Logout", "Success", "Admin logged out state synchronized.", user.Id, user.FullName, user.Role.ToString());
                    return Ok(new { success = true, message = "You have been logged out successfully.", errors = (object?)null });
                }
            }

            await LogBothAsync("Logout", "Success", "Admin logged out state synchronized.");
            return Ok(new { success = true, message = "You have been logged out successfully.", errors = (object?)null });
        }

        private string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(ClaimTypes.Role, user.Role.ToString() ?? "Patient")
            };
            var token = new JwtSecurityToken(
                _configuration["Jwt:Issuer"],
                _configuration["Jwt:Audience"],
                claims,
                expires: DateTime.Now.AddDays(1),
                signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    // ── DTOs with full Data Annotation validation ─────────────────────────────────
    public class AdminRegisterDto
    {
        [Required(ErrorMessage = "Full name is required.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Full name must be between 2 and 100 characters.")]
        public string FullName { get; set; } = null!;

        [Required(ErrorMessage = "Email address is required.")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address.")]
        [StringLength(200, ErrorMessage = "Email address must not exceed 200 characters.")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Password is required.")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters long.")]
        [RegularExpression(@"^(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$",
            ErrorMessage = "Password must contain at least one number and one special character (e.g. !@#$).")]
        public string Password { get; set; } = null!;

        [Required(ErrorMessage = "Phone number is required.")]
        [RegularExpression(@"^(\+65\d{8}|\+60\d{9,10})$",
            ErrorMessage = "Phone number must be a valid Singapore (+65, 8 digits) or Malaysia (+60, 9–10 digits) number.")]
        public string PhoneNumber { get; set; } = null!;

        [Required(ErrorMessage = "System role is required.")]
        public string Role { get; set; } = null!;
    }

    public class AdminLoginDto
    {
        [Required(ErrorMessage = "Email address is required.")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address.")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Password is required.")]
        public string Password { get; set; } = null!;
    }
}