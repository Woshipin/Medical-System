using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.IdentityModel.Tokens.Jwt;
using MedicalSystem.Data;
using MedicalSystem.Models;
using MedicalSystem.Services;

namespace MedicalSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SpecialtyController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly IActivityLogService _activityLog;
        private readonly ILogger<SpecialtyController> _logger;

        public SpecialtyController(
            AppDbContext context, 
            UserManager<User> userManager, 
            IActivityLogService activityLog,
            ILogger<SpecialtyController> logger)
        {
            _context = context;
            _userManager = userManager;
            _activityLog = activityLog;
            _logger = logger;
        }

        // 修复：返回 int? id 以匹配 LogExplicitAsync 签名
        private async Task<(int? id, string name, string role)> GetCurrentOperatorAsync()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!string.IsNullOrEmpty(userIdStr) && int.TryParse(userIdStr, out int userId))
            {
                var user = await _userManager.FindByIdAsync(userIdStr);
                if (user != null)
                {
                    return (user.Id, user.FullName ?? "Unknown", user.Role.ToString() ?? "Visitor");
                }
            }
            return (null, "System/Unknown", "Visitor");
        }

        private async Task LogBothAsync(string actionName, string status, string message)
        {
            var op = await GetCurrentOperatorAsync();
            _logger.LogInformation("[SpecialtyController.{ActionName}] {Status}: {Message}", actionName, status, message);
            await _activityLog.LogExplicitAsync(op.id, op.name, op.role, actionName, $"[{status}] {message}");
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _context.Specialties.OrderByDescending(s => s.id).ToListAsync();
            await LogBothAsync("Read", "Success", $"Retrieved {list.Count} specialties.");
            return Ok(ApiResponse<IEnumerable<Specialty>>.SuccessResponse(list, "Specialties retrieved successfully."));
        }

        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveList()
        {
            var list = await _context.Specialties.Where(s => s.status == 1).OrderBy(s => s.name).ToListAsync();
            await LogBothAsync("Read", "Success", $"Retrieved {list.Count} active specialties.");
            return Ok(ApiResponse<IEnumerable<Specialty>>.SuccessResponse(list, "Active specialties retrieved successfully."));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var specialty = await _context.Specialties.FindAsync(id);
            if (specialty == null)
            {
                await LogBothAsync("Read", "Failed", $"Specialty not found for ID: {id}");
                return NotFound(ApiResponse<string>.FailureResponse("Specialty not found."));
            }

            await LogBothAsync("Read", "Success", $"Retrieved specialty ID: {id}");
            return Ok(ApiResponse<Specialty>.SuccessResponse(specialty, "Specialty retrieved successfully."));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Specialty model)
        {
            if (!ModelState.IsValid)
            {
                var validationErrors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                await LogBothAsync("Create", "Failed", "Data format error.");
                return BadRequest(ApiResponse<List<string>>.FailureResponse("Data validation failed.", validationErrors));
            }

            var exists = await _context.Specialties.AnyAsync(s => s.name == model.name.Trim());
            if (exists)
            {
                await LogBothAsync("Create", "Failed", $"Name conflict: Specialty '{model.name}' already exists.");
                return BadRequest(ApiResponse<string>.FailureResponse("Specialty name already exists."));
            }

            var specialty = new Specialty
            {
                name = model.name.Trim(),
                status = model.status,
                created_at = DateTime.Now,
                updated_at = DateTime.Now
            };

            _context.Specialties.Add(specialty);
            await _context.SaveChangesAsync();

            await LogBothAsync(
                "Create", 
                "Success", 
                $"Created new specialty:\n• ID -> {specialty.id}\n• Specialty Name -> {specialty.name}\n• Initial Status -> {(specialty.status == 1 ? "Active" : "Inactive")}"
            );

            return Ok(ApiResponse<Specialty>.SuccessResponse(specialty, "Specialty created successfully."));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Specialty model)
        {
            if (id != model.id)
            {
                await LogBothAsync("Update", "Failed", "ID mismatch in request.");
                return BadRequest(ApiResponse<string>.FailureResponse("Invalid request."));
            }

            if (!ModelState.IsValid)
            {
                var validationErrors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                await LogBothAsync("Update", "Failed", "Data validation failed.");
                return BadRequest(ApiResponse<List<string>>.FailureResponse("Data validation failed.", validationErrors));
            }

            var specialty = await _context.Specialties.FindAsync(id);
            if (specialty == null)
            {
                await LogBothAsync("Update", "Failed", $"Specialty not found for ID: {id}");
                return NotFound(ApiResponse<string>.FailureResponse("Specialty not found."));
            }

            var nameDuplicated = await _context.Specialties.AnyAsync(s => s.name == model.name.Trim() && s.id != id);
            if (nameDuplicated)
            {
                await LogBothAsync("Update", "Failed", $"Name conflict: The specialty name '{model.name}' is already taken.");
                return BadRequest(ApiResponse<string>.FailureResponse("Specialty name is already taken."));
            }

            string oldName = specialty.name;
            int oldStatus = specialty.status;

            specialty.name = model.name.Trim();
            specialty.status = model.status;
            specialty.updated_at = DateTime.Now;

            await _context.SaveChangesAsync();

            await LogBothAsync(
                "Update", 
                "Success", 
                $"Updated specialty (ID: {id}):\n• Specialty Name: {oldName} ➔ {specialty.name}\n• Status: {(oldStatus == 1 ? "Active" : "Inactive")} ➔ {(specialty.status == 1 ? "Active" : "Inactive")}"
            );

            return Ok(ApiResponse<Specialty>.SuccessResponse(specialty, "Specialty updated successfully."));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var specialty = await _context.Specialties.FindAsync(id);
            if (specialty == null)
            {
                await LogBothAsync("Delete", "Failed", $"Specialty not found for ID: {id}");
                return NotFound(ApiResponse<string>.FailureResponse("Specialty not found."));
            }

            var hasDoctors = await _context.Doctors.AnyAsync(d => d.SpecialtyId == id);
            if (hasDoctors)
            {
                await LogBothAsync("Delete", "Failed", $"Cannot delete specialty ID: {id}. It is currently assigned to doctors.");
                return BadRequest(ApiResponse<string>.FailureResponse("Cannot delete: Specialty is currently assigned to doctors."));
            }

            _context.Specialties.Remove(specialty);
            await _context.SaveChangesAsync();

            await LogBothAsync(
                "Delete", 
                "Success", 
                $"Deleted specialty:\n• ID -> {specialty.id}\n• Specialty Name -> {specialty.name}"
            );

            return Ok(ApiResponse<string>.SuccessResponse(null, "Specialty deleted successfully."));
        }
    }
}