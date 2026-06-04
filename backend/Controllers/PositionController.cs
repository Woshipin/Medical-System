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
    public class PositionController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IActivityLogService _activityLog;
        private readonly ILogger<PositionController> _logger;

        public PositionController(
            AppDbContext context, 
            IActivityLogService activityLog,
            ILogger<PositionController> logger)
        {
            _context = context;
            _activityLog = activityLog;
            _logger = logger;
        }

        private async Task LogBothAsync(string actionName, string status, string message)
        {
            _logger.LogInformation("[PositionController.{ActionName}] {Status}: {Message}", actionName, status, message);
            await _activityLog.LogAsync(actionName, $"[{status}] {message}");
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _context.Positions.OrderByDescending(p => p.id).ToListAsync();
            await LogBothAsync("Read", "Success", $"Retrieved {list.Count} positions.");
            return Ok(new { success = true, message = "Positions retrieved successfully.", data = list });
        }

        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveList()
        {
            var list = await _context.Positions.Where(p => p.status == 1).OrderBy(p => p.id).ToListAsync();
            await LogBothAsync("Read", "Success", $"Retrieved {list.Count} active positions.");
            return Ok(new { success = true, message = "Active positions retrieved successfully.", data = list });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var position = await _context.Positions.FindAsync(id);
            if (position == null)
            {
                await LogBothAsync("Read", "Failed", $"Position not found for ID: {id}");
                return NotFound(new { success = false, message = "Position not found." });
            }

            await LogBothAsync("Read", "Success", $"Retrieved position ID: {id}");
            return Ok(new { success = true, message = "Position retrieved successfully.", data = position });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PositionDto model)
        {
            if (!ModelState.IsValid)
            {
                var fieldErrors = ModelState
                    .Where(x => x.Value != null && x.Value.Errors.Count > 0)
                    .ToDictionary(x => x.Key, x => x.Value!.Errors.First().ErrorMessage);

                await LogBothAsync("Create", "Failed", "Data format error.");
                return BadRequest(new { success = false, message = "Please fix the validation errors below.", errors = fieldErrors });
            }

            var exists = await _context.Positions.AnyAsync(p => p.name == model.Name.Trim());
            if (exists)
            {
                await LogBothAsync("Create", "Failed", $"Name conflict: Position '{model.Name}' already exists.");
                return BadRequest(new { success = false, message = "Position name already exists.", errors = new Dictionary<string, string> { { "name", "This position name is already taken." } } });
            }

            var position = new Position
            {
                name = model.Name.Trim(),
                status = model.Status,
                created_at = DateTime.UtcNow,
                updated_at = DateTime.UtcNow
            };

            _context.Positions.Add(position);
            await _context.SaveChangesAsync();

            await LogBothAsync(
                "Create", 
                "Success", 
                $"Created new position:\n• ID -> {position.id}\n• Position Name -> {position.name}\n• Initial Status -> {(position.status == 1 ? "Active" : "Inactive")}"
            );

            return Ok(new { success = true, message = "Position created successfully.", data = position });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] PositionDto model)
        {
            if (!ModelState.IsValid)
            {
                var fieldErrors = ModelState
                    .Where(x => x.Value != null && x.Value.Errors.Count > 0)
                    .ToDictionary(x => x.Key, x => x.Value!.Errors.First().ErrorMessage);

                await LogBothAsync("Update", "Failed", "Data validation failed.");
                return BadRequest(new { success = false, message = "Please fix the validation errors below.", errors = fieldErrors });
            }

            var position = await _context.Positions.FindAsync(id);
            if (position == null)
            {
                await LogBothAsync("Update", "Failed", $"Position not found for ID: {id}");
                return NotFound(new { success = false, message = "Position not found." });
            }

            var exists = await _context.Positions.AnyAsync(p => p.name == model.Name.Trim() && p.id != id);
            if (exists)
            {
                await LogBothAsync("Update", "Failed", $"Name conflict: The position name '{model.Name}' is already taken.");
                return BadRequest(new { success = false, message = "Position name is already taken.", errors = new Dictionary<string, string> { { "name", "This position name is already taken." } } });
            }

            string oldName = position.name;
            int oldStatus = position.status;

            position.name = model.Name.Trim();
            position.status = model.Status;
            position.updated_at = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await LogBothAsync(
                "Update", 
                "Success", 
                $"Updated position (ID: {id}):\n• Position Name: {oldName} ➔ {position.name}\n• Status: {(oldStatus == 1 ? "Active" : "Inactive")} ➔ {(position.status == 1 ? "Active" : "Inactive")}"
            );

            return Ok(new { success = true, message = "Position updated successfully." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var position = await _context.Positions.FindAsync(id);
            if (position == null)
            {
                await LogBothAsync("Delete", "Failed", $"Position not found for ID: {id}");
                return NotFound(new { success = false, message = "Position not found." });
            }

            var hasDoctors = await _context.Doctors.AnyAsync(d => d.PositionId == id);
            if (hasDoctors)
            {
                await LogBothAsync("Delete", "Failed", $"Cannot delete position ID: {id}. It is currently assigned to doctors.");
                return BadRequest(new { success = false, message = "Cannot delete: Position is currently assigned to doctors." });
            }

            _context.Positions.Remove(position);
            await _context.SaveChangesAsync();

            await LogBothAsync(
                "Delete", 
                "Success", 
                $"Deleted position:\n• ID -> {position.id}\n• Position Name -> {position.name}"
            );

            return Ok(new { success = true, message = "Position deleted successfully." });
        }
    }

    public class PositionDto
    {
        [Required(ErrorMessage = "Position title name is required.")]
        [StringLength(100, ErrorMessage = "Position title cannot exceed 100 characters.")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "Operational status is required.")]
        public int Status { get; set; } = 1;
    }
}