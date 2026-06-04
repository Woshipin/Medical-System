using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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
        private readonly IActivityLogService _activityLog;
        private readonly ILogger<SpecialtyController> _logger;

        public SpecialtyController(
            AppDbContext context, 
            IActivityLogService activityLog,
            ILogger<SpecialtyController> logger)
        {
            _context = context;
            _activityLog = activityLog;
            _logger = logger;
        }

        private async Task LogBothAsync(string actionName, string status, string message)
        {
            _logger.LogInformation("[SpecialtyController.{ActionName}] {Status}: {Message}", actionName, status, message);
            await _activityLog.LogAsync(actionName, $"[{status}] {message}");
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _context.Specialties.OrderByDescending(s => s.id).ToListAsync();
            await LogBothAsync("Read", "Success", $"Retrieved {list.Count} specialties.");
            return Ok(new { success = true, message = "Specialties retrieved successfully.", data = list });
        }

        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveList()
        {
            var list = await _context.Specialties.Where(s => s.status == 1).OrderBy(s => s.name).ToListAsync();
            await LogBothAsync("Read", "Success", $"Retrieved {list.Count} active specialties.");
            return Ok(new { success = true, message = "Active specialties retrieved successfully.", data = list });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var specialty = await _context.Specialties.FindAsync(id);
            if (specialty == null)
            {
                await LogBothAsync("Read", "Failed", $"Specialty not found for ID: {id}");
                return NotFound(new { success = false, message = "Specialty not found." });
            }

            await LogBothAsync("Read", "Success", $"Retrieved specialty ID: {id}");
            return Ok(new { success = true, message = "Specialty retrieved successfully.", data = specialty });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SpecialtyDto model)
        {
            if (!ModelState.IsValid)
            {
                var fieldErrors = ModelState
                    .Where(x => x.Value != null && x.Value.Errors.Count > 0)
                    .ToDictionary(x => x.Key, x => x.Value!.Errors.First().ErrorMessage);

                await LogBothAsync("Create", "Failed", "Data format error.");
                return BadRequest(new { success = false, message = "Data validation failed.", errors = fieldErrors });
            }

            var exists = await _context.Specialties.AnyAsync(s => s.name == model.Name.Trim());
            if (exists)
            {
                await LogBothAsync("Create", "Failed", $"Name conflict: Specialty '{model.Name}' already exists.");
                return BadRequest(new { success = false, message = "Specialty name already exists.", errors = new Dictionary<string, string> { { "name", "This specialty name is already taken." } } });
            }

            var specialty = new Specialty
            {
                name = model.Name.Trim(),
                status = model.Status,
                created_at = DateTime.UtcNow,
                updated_at = DateTime.UtcNow
            };

            _context.Specialties.Add(specialty);
            await _context.SaveChangesAsync();

            await LogBothAsync(
                "Create", 
                "Success", 
                $"Created new specialty:\n• ID -> {specialty.id}\n• Specialty Name -> {specialty.name}\n• Initial Status -> {(specialty.status == 1 ? "Active" : "Inactive")}"
            );

            return Ok(new { success = true, message = "Specialty created successfully.", data = specialty });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] SpecialtyDto model)
        {
            if (!ModelState.IsValid)
            {
                var fieldErrors = ModelState
                    .Where(x => x.Value != null && x.Value.Errors.Count > 0)
                    .ToDictionary(x => x.Key, x => x.Value!.Errors.First().ErrorMessage);

                await LogBothAsync("Update", "Failed", "Data validation failed.");
                return BadRequest(new { success = false, message = "Data validation failed.", errors = fieldErrors });
            }

            var specialty = await _context.Specialties.FindAsync(id);
            if (specialty == null)
            {
                await LogBothAsync("Update", "Failed", $"Specialty not found for ID: {id}");
                return NotFound(new { success = false, message = "Specialty not found." });
            }

            var nameDuplicated = await _context.Specialties.AnyAsync(s => s.name == model.Name.Trim() && s.id != id);
            if (nameDuplicated)
            {
                await LogBothAsync("Update", "Failed", $"Name conflict: The specialty name '{model.Name}' is already taken.");
                return BadRequest(new { success = false, message = "Specialty name is already taken.", errors = new Dictionary<string, string> { { "name", "This specialty name is already taken by another record." } } });
            }

            string oldName = specialty.name;
            int oldStatus = specialty.status;

            specialty.name = model.Name.Trim();
            specialty.status = model.Status;
            specialty.updated_at = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await LogBothAsync(
                "Update", 
                "Success", 
                $"Updated specialty (ID: {id}):\n• Specialty Name: {oldName} ➔ {specialty.name}\n• Status: {(oldStatus == 1 ? "Active" : "Inactive")} ➔ {(specialty.status == 1 ? "Active" : "Inactive")}"
            );

            return Ok(new { success = true, message = "Specialty updated successfully." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var specialty = await _context.Specialties.FindAsync(id);
            if (specialty == null)
            {
                await LogBothAsync("Delete", "Failed", $"Specialty not found for ID: {id}");
                return NotFound(new { success = false, message = "Specialty not found." });
            }

            var hasDoctors = await _context.Doctors.AnyAsync(d => d.SpecialtyId == id);
            if (hasDoctors)
            {
                await LogBothAsync("Delete", "Failed", $"Cannot delete specialty ID: {id}. It is currently assigned to doctors.");
                return BadRequest(new { success = false, message = "Cannot delete: Specialty is currently assigned to doctors." });
            }

            _context.Specialties.Remove(specialty);
            await _context.SaveChangesAsync();

            await LogBothAsync(
                "Delete", 
                "Success", 
                $"Deleted specialty:\n• ID -> {specialty.id}\n• Specialty Name -> {specialty.name}"
            );

            return Ok(new { success = true, message = "Specialty deleted successfully." });
        }
    }

    public class SpecialtyDto
    {
        [Required(ErrorMessage = "Specialty name is required.")]
        [StringLength(100, ErrorMessage = "Specialty name cannot exceed 100 characters.")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "Operational status is required.")]
        public int Status { get; set; } = 1;
    }
}