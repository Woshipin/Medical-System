using System; 
using System.Collections.Generic; 
using System.Linq; 
using System.Threading.Tasks; 
using System.ComponentModel.DataAnnotations;
using MedicalSystem.Data;     
using MedicalSystem.Models;   
using Microsoft.AspNetCore.Mvc; 
using Microsoft.EntityFrameworkCore; 
using MedicalSystem.Services; 
using Microsoft.Extensions.Logging;

namespace MedicalSystem.Controllers 
{
    [Route("api/[controller]")] 
    [ApiController] 
    public class ServiceController : ControllerBase 
    {
        private readonly AppDbContext _context; 
        private readonly IActivityLogService _activityLog; 
        private readonly ILogger<ServiceController> _logger; 

        public ServiceController(
            AppDbContext context, 
            IActivityLogService activityLog,
            ILogger<ServiceController> logger) 
        {
            _context = context; 
            _activityLog = activityLog; 
            _logger = logger;
        }

        private async Task LogBothAsync(string actionName, string status, string message)
        {
            _logger.LogInformation("[ServiceController.{ActionName}] {Status}: {Message}", actionName, status, message);
            await _activityLog.LogAsync(actionName, $"[{status}] {message}");
        }

        [HttpGet] 
        public async Task<IActionResult> GetServices() 
        {
            var data = await _context.Services.ToListAsync(); 
            await LogBothAsync("Read", "Success", $"Retrieved {data.Count} services.");
            return Ok(data); 
        }

        [HttpPost] 
        public async Task<IActionResult> PostService([FromBody] ServiceDto model) 
        {
            if (!ModelState.IsValid) 
            {
                var fieldErrors = ModelState
                    .Where(x => x.Value != null && x.Value.Errors.Count > 0)
                    .ToDictionary(x => x.Key, x => x.Value!.Errors.First().ErrorMessage);

                await LogBothAsync("Create", "Failed", "Model validation failed.");
                return BadRequest(new { success = false, message = "Please fix the validation errors below.", errors = fieldErrors }); 
            }

            var service = new Service
            {
                name = model.Name.Trim(),
                status = model.Status
            };

            _context.Services.Add(service); 
            await _context.SaveChangesAsync(); 

            await LogBothAsync(
                "Create", 
                "Success", 
                $"Created new Service:\n• Service ID -> {service.id}\n• Service Name -> {service.name}\n• Status -> {(service.status == 1 ? "Active" : "Inactive")}"
            );

            return Ok(new { success = true, message = "Service created successfully.", data = service }); 
        }

        [HttpPut("{id}")] 
        public async Task<IActionResult> PutService(int id, [FromBody] ServiceDto model) 
        {
            if (!ModelState.IsValid) 
            {
                var fieldErrors = ModelState
                    .Where(x => x.Value != null && x.Value.Errors.Count > 0)
                    .ToDictionary(x => x.Key, x => x.Value!.Errors.First().ErrorMessage);

                await LogBothAsync("Update", "Failed", $"Model validation failed for service ID: {id}");
                return BadRequest(new { success = false, message = "Please fix the validation errors below.", errors = fieldErrors }); 
            }

            var existing = await _context.Services.FirstOrDefaultAsync(s => s.id == id); 
            if (existing == null) 
            {
                await LogBothAsync("Update", "Failed", $"Service not found for ID: {id}");
                return NotFound(new { success = false, message = "Service not found." }); 
            }

            var changes = new List<string>(); 
            if (existing.name != model.Name.Trim()) changes.Add($"• Service Name -> {existing.name} ➔ {model.Name.Trim()}"); 
            if (existing.status != model.Status) changes.Add($"• Status -> {(existing.status == 1 ? "Active" : "Inactive")} ➔ {(model.Status == 1 ? "Active" : "Inactive")}"); 

            existing.name = model.Name.Trim();
            existing.status = model.Status;

            try 
            { 
                await _context.SaveChangesAsync(); 

                string logDetails = changes.Any() 
                    ? $"Updated service (ID: {id}):\n{string.Join("\n", changes)}" 
                    : $"Updated service (ID: {id}):\n• No fields were modified."; 

                await LogBothAsync("Update", "Success", logDetails); 
            } 
            catch (DbUpdateConcurrencyException) 
            {
                if (!_context.Services.Any(e => e.id == id)) 
                {
                    await LogBothAsync("Update", "Failed", $"Concurrency error: Service {id} not found.");
                    return NotFound(new { success = false, message = "Concurrency error. Service not found." }); 
                }
                else throw; 
            }

            return Ok(new { success = true, message = "Service updated successfully." }); 
        }

        [HttpDelete("{id}")] 
        public async Task<IActionResult> DeleteService(int id) 
        {
            var service = await _context.Services.FindAsync(id); 
            if (service == null) 
            {
                await LogBothAsync("Delete", "Failed", $"Service not found for ID: {id}");
                return NotFound(new { success = false, message = "Service not found." }); 
            }

            _context.Services.Remove(service); 
            await _context.SaveChangesAsync(); 

            await LogBothAsync(
                "Delete", 
                "Success", 
                $"Deleted Service:\n• Service ID -> {service.id}\n• Service Name -> {service.name}\n• Status -> {(service.status == 1 ? "Active" : "Inactive")}"
            );

            return Ok(new { success = true, message = "Service deleted successfully." }); 
        }
    }

    public class ServiceDto
    {
        [Required(ErrorMessage = "Service name is required.")]
        [StringLength(150, ErrorMessage = "Service name cannot exceed 150 characters.")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "Operational status is required.")]
        public int Status { get; set; } = 1;
    }
}