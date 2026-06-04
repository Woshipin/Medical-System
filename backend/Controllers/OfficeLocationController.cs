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
    public class OfficeLocationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IActivityLogService _activityLog;
        private readonly ILogger<OfficeLocationController> _logger;

        public OfficeLocationController(
            AppDbContext context, 
            IActivityLogService activityLog,
            ILogger<OfficeLocationController> logger)
        {
            _context = context;
            _activityLog = activityLog;
            _logger = logger;
        }

        private async Task LogBothAsync(string actionName, string status, string message)
        {
            _logger.LogInformation("[OfficeLocationController.{ActionName}] {Status}: {Message}", actionName, status, message);
            await _activityLog.LogAsync(actionName, $"[{status}] {message}");
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _context.OfficeLocations.OrderByDescending(o => o.id).ToListAsync();
            await LogBothAsync("Read", "Success", $"Retrieved {list.Count} office locations.");
            return Ok(new { success = true, message = "Office locations retrieved successfully.", data = list });
        }

        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveList()
        {
            var list = await _context.OfficeLocations.Where(o => o.status == 1).OrderBy(o => o.name).ToListAsync();
            await LogBothAsync("Read", "Success", $"Retrieved {list.Count} active office locations.");
            return Ok(new { success = true, message = "Active office locations retrieved successfully.", data = list });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var location = await _context.OfficeLocations.FindAsync(id);
            if (location == null)
            {
                await LogBothAsync("Read", "Failed", $"Office location not found for ID: {id}");
                return NotFound(new { success = false, message = "Office location not found." });
            }

            await LogBothAsync("Read", "Success", $"Retrieved office location ID: {id}");
            return Ok(new { success = true, message = "Office location retrieved successfully.", data = location });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] OfficeLocationDto model)
        {
            if (!ModelState.IsValid)
            {
                var fieldErrors = ModelState
                    .Where(x => x.Value != null && x.Value.Errors.Count > 0)
                    .ToDictionary(x => x.Key, x => x.Value!.Errors.First().ErrorMessage);

                await LogBothAsync("Create", "Failed", "Data format error.");
                return BadRequest(new { success = false, message = "Please fix the validation errors below.", errors = fieldErrors });
            }

            var exists = await _context.OfficeLocations.AnyAsync(o => o.name == model.Name.Trim());
            if (exists)
            {
                await LogBothAsync("Create", "Failed", $"Name conflict: Office location '{model.Name}' already exists.");
                return BadRequest(new { success = false, message = "Name conflict: Office location already exists.", errors = new Dictionary<string, string> { { "name", "This location name is already taken." } } });
            }

            var location = new OfficeLocation
            {
                name = model.Name.Trim(),
                status = model.Status,
                created_at = DateTime.UtcNow,
                updated_at = DateTime.UtcNow
            };

            _context.OfficeLocations.Add(location);
            await _context.SaveChangesAsync();

            await LogBothAsync(
                "Create", 
                "Success", 
                $"Created new office location:\n• ID -> {location.id}\n• Location Name -> {location.name}\n• Initial Status -> {(location.status == 1 ? "Active" : "Inactive")}"
            );

            return Ok(new { success = true, message = "Office location created successfully.", data = location });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] OfficeLocationDto model)
        {
            if (!ModelState.IsValid)
            {
                var fieldErrors = ModelState
                    .Where(x => x.Value != null && x.Value.Errors.Count > 0)
                    .ToDictionary(x => x.Key, x => x.Value!.Errors.First().ErrorMessage);

                await LogBothAsync("Update", "Failed", "Data validation failed.");
                return BadRequest(new { success = false, message = "Please fix the validation errors below.", errors = fieldErrors });
            }

            var location = await _context.OfficeLocations.FindAsync(id);
            if (location == null)
            {
                await LogBothAsync("Update", "Failed", $"Office location not found for ID: {id}");
                return NotFound(new { success = false, message = "Office location not found." });
            }

            var exists = await _context.OfficeLocations.AnyAsync(o => o.name == model.Name.Trim() && o.id != id);
            if (exists)
            {
                await LogBothAsync("Update", "Failed", $"Name conflict: The location name '{model.Name}' is already taken.");
                return BadRequest(new { success = false, message = "Name conflict: Office location name is already taken.", errors = new Dictionary<string, string> { { "name", "This location name is already taken." } } });
            }

            string oldName = location.name;
            int oldStatus = location.status;

            location.name = model.Name.Trim();
            location.status = model.Status;
            location.updated_at = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await LogBothAsync(
                "Update", 
                "Success", 
                $"Updated office location (ID: {id}):\n• Location Name: {oldName} ➔ {location.name}\n• Status: {(oldStatus == 1 ? "Active" : "Inactive")} ➔ {(location.status == 1 ? "Active" : "Inactive")}"
            );

            return Ok(new { success = true, message = "Office location updated successfully." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var location = await _context.OfficeLocations.FindAsync(id);
            if (location == null)
            {
                await LogBothAsync("Delete", "Failed", $"Office location not found for ID: {id}");
                return NotFound(new { success = false, message = "Office location not found." });
            }

            var hasDoctors = await _context.Doctors.AnyAsync(d => d.OfficeLocationId == id);
            if (hasDoctors)
            {
                await LogBothAsync("Delete", "Failed", $"Cannot delete location ID: {id}. It is currently assigned to doctors.");
                return BadRequest(new { success = false, message = "Cannot delete: Office location is currently assigned to doctors." });
            }

            _context.OfficeLocations.Remove(location);
            await _context.SaveChangesAsync();

            await LogBothAsync(
                "Delete", 
                "Success", 
                $"Deleted office location:\n• ID -> {location.id}\n• Location Name -> {location.name}"
            );

            return Ok(new { success = true, message = "Office location deleted successfully." });
        }
    }

    public class OfficeLocationDto
    {
        [Required(ErrorMessage = "Location name is required.")]
        [StringLength(200, ErrorMessage = "Location name cannot exceed 200 characters.")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "Operational status is required.")]
        public int Status { get; set; } = 1;
    }
}