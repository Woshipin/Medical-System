using System; 
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks; 
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc; 
using Microsoft.EntityFrameworkCore; 
using MedicalSystem.Data; 
using MedicalSystem.Models; 
using MedicalSystem.Services; 
using Microsoft.Extensions.Logging;

namespace MedicalSystem.Controllers 
{
    [ApiController] 
    [Route("api/[controller]")] 
    public class GendersController : ControllerBase 
    {
        private readonly AppDbContext _context; 
        private readonly IActivityLogService _activityLog; 
        private readonly ILogger<GendersController> _logger; 

        public GendersController(
            AppDbContext context, 
            IActivityLogService activityLog,
            ILogger<GendersController> logger) 
        { 
            _context = context; 
            _activityLog = activityLog; 
            _logger = logger;
        } 

        private async Task LogBothAsync(string actionName, string status, string message)
        {
            _logger.LogInformation("[GendersController.{ActionName}] {Status}: {Message}", actionName, status, message);
            await _activityLog.LogAsync(actionName, $"[{status}] {message}");
        }

        [HttpGet] 
        public async Task<IActionResult> GetAll() 
        {
            var data = await _context.Genders.ToListAsync(); 
            await LogBothAsync("Read", "Success", $"Retrieved {data.Count} gender options.");
            return Ok(data); 
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var gender = await _context.Genders.FindAsync(id);
            if (gender == null) 
            {
                await LogBothAsync("Read", "Failed", $"Gender not found for ID: {id}");
                return NotFound(new { success = false, message = "Gender not found." });
            }
            
            await LogBothAsync("Read", "Success", $"Retrieved gender ID: {id}");
            return Ok(new { success = true, message = "Gender retrieved successfully.", data = gender });
        }

        [HttpPost] 
        public async Task<IActionResult> Create([FromBody] GenderDto model) 
        {
            if (!ModelState.IsValid) 
            {
                var fieldErrors = ModelState
                    .Where(x => x.Value != null && x.Value.Errors.Count > 0)
                    .ToDictionary(x => x.Key, x => x.Value!.Errors.First().ErrorMessage);

                await LogBothAsync("Create", "Failed", "Model validation failed.");
                return BadRequest(new { success = false, message = "Please fix the validation errors below.", errors = fieldErrors }); 
            }

            if (await _context.Genders.AnyAsync(g => g.name == model.Name.Trim())) 
            {
                await LogBothAsync("Create", "Failed", $"Gender name already exists: {model.Name}");
                return BadRequest(new { success = false, message = "Gender name already exists.", errors = new Dictionary<string, string> { { "name", "This gender name is already taken." } } }); 
            }

            var gender = new Gender
            {
                name = model.Name.Trim(),
                status = model.Status
            };

            _context.Genders.Add(gender); 
            await _context.SaveChangesAsync(); 

            await LogBothAsync(
                "Create", 
                "Success", 
                $"Created new Gender option:\n• Gender ID -> {gender.id}\n• Gender Name -> {gender.name}\n• Status -> {(gender.status == 1 ? "Active" : "Inactive")}"
            );

            return Ok(new { success = true, message = "Gender created successfully.", data = gender }); 
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] GenderDto model)
        {
            if (!ModelState.IsValid) 
            {
                var fieldErrors = ModelState
                    .Where(x => x.Value != null && x.Value.Errors.Count > 0)
                    .ToDictionary(x => x.Key, x => x.Value!.Errors.First().ErrorMessage);

                await LogBothAsync("Update", "Failed", $"Model validation failed for gender ID: {id}");
                return BadRequest(new { success = false, message = "Please fix the validation errors below.", errors = fieldErrors }); 
            }

            var existing = await _context.Genders.FirstOrDefaultAsync(g => g.id == id);
            if (existing == null) 
            {
                await LogBothAsync("Update", "Failed", $"Gender not found for ID: {id}");
                return NotFound(new { success = false, message = "Gender not found." });
            }

            if (await _context.Genders.AnyAsync(g => g.name == model.Name.Trim() && g.id != id)) 
            {
                await LogBothAsync("Update", "Failed", $"Gender name conflict: {model.Name}");
                return BadRequest(new { success = false, message = "Gender name already exists.", errors = new Dictionary<string, string> { { "name", "This gender name is already taken by another record." } } }); 
            }

            var changes = new List<string>();
            if (existing.name != model.Name.Trim()) changes.Add($"• Gender Name -> {existing.name} ➔ {model.Name.Trim()}");
            if (existing.status != model.Status) changes.Add($"• Status -> {(existing.status == 1 ? "Active" : "Inactive")} ➔ {(model.Status == 1 ? "Active" : "Inactive")}");

            existing.name = model.Name.Trim();
            existing.status = model.Status;

            try
            {
                await _context.SaveChangesAsync();

                string logDetails = changes.Any()
                    ? $"Updated Gender details (ID: {id}):\n{string.Join("\n", changes)}"
                    : $"Updated Gender details (ID: {id}):\n• No fields were modified.";

                await LogBothAsync("Update", "Success", logDetails);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Genders.Any(e => e.id == id)) 
                {
                    await LogBothAsync("Update", "Failed", $"Concurrency error: Gender {id} not found.");
                    return NotFound(new { success = false, message = "Concurrency error. Gender not found." });
                }
                else throw;
            }

            return Ok(new { success = true, message = "Gender updated successfully." });
        }

        [HttpDelete("{id}")] 
        public async Task<IActionResult> Delete(int id) 
        {
            var gender = await _context.Genders.FindAsync(id); 
            if (gender == null) 
            {
                await LogBothAsync("Delete", "Failed", $"Gender not found for ID: {id}");
                return NotFound(new { success = false, message = "Gender not found." }); 
            }

            bool isInUse = await _context.Users.AnyAsync(u => u.GenderId == id); 
            if (isInUse) 
            {
                await LogBothAsync("Delete", "Failed", $"Cannot delete gender ID: {id}. It is currently in use.");
                return BadRequest(new { success = false, message = "Cannot delete: Gender is currently assigned to users." }); 
            }

            _context.Genders.Remove(gender); 
            await _context.SaveChangesAsync(); 

            await LogBothAsync(
                "Delete", 
                "Success", 
                $"Deleted Gender option:\n• Gender ID -> {gender.id}\n• Gender Name -> {gender.name}\n• Status -> {(gender.status == 1 ? "Active" : "Inactive")}"
            );

            return Ok(new { success = true, message = "Gender deleted successfully." }); 
        }
    }

    public class GenderDto
    {
        [Required(ErrorMessage = "Gender name is required.")]
        [StringLength(50, ErrorMessage = "Gender name cannot exceed 50 characters.")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "Operational status is required.")]
        public int Status { get; set; } = 1;
    }
}