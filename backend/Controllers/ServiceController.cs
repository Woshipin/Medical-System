using System; 
using System.Collections.Generic; 
using System.Linq; 
using System.Threading.Tasks; 
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

        // 统一双写日志方法 (File + ActivityLog)
        private async Task LogBothAsync(string actionName, string status, string message)
        {
            _logger.LogInformation("[ServiceController.{ActionName}] {Status}: {Message}", actionName, status, message);
            await _activityLog.LogAsync(actionName, $"[{status}] {message}");
        }

        [HttpGet] 
        public async Task<ActionResult<IEnumerable<Service>>> GetServices() 
        {
            var data = await _context.Services.ToListAsync(); 
            await LogBothAsync("Read", "Success", $"Retrieved {data.Count} services.");
            return data;
        }

        [HttpPost] 
        public async Task<ActionResult<Service>> PostService(Service service) 
        {
            _context.Services.Add(service); 
            await _context.SaveChangesAsync(); 

            await LogBothAsync(
                "Create", 
                "Success", 
                $"Created new Service:\n• Service ID -> {service.id}\n• Service Name -> {service.name}\n• Status -> {(service.status == 1 ? "Active" : "Inactive")}"
            );

            return CreatedAtAction(nameof(GetServices), new { id = service.id }, service); 
        }

        [HttpPut("{id}")] 
        public async Task<IActionResult> PutService(int id, Service service) 
        {
            if (id != service.id) 
            {
                await LogBothAsync("Update", "Failed", "ID mismatch in request.");
                return BadRequest(); 
            }

            var existing = await _context.Services.AsNoTracking().FirstOrDefaultAsync(s => s.id == id); 
            if (existing == null) 
            {
                await LogBothAsync("Update", "Failed", $"Service not found for ID: {id}");
                return NotFound(); 
            }

            var changes = new List<string>(); 
            if (existing.name != service.name) changes.Add($"• Service Name -> {existing.name} ➔ {service.name}"); 
            if (existing.status != service.status) changes.Add($"• Status -> {(existing.status == 1 ? "Active" : "Inactive")} ➔ {(service.status == 1 ? "Active" : "Inactive")}"); 

            _context.Entry(service).State = EntityState.Modified; 

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
                    return NotFound(); 
                }
                else throw; 
            }
            return NoContent(); 
        }

        [HttpDelete("{id}")] 
        public async Task<IActionResult> DeleteService(int id) 
        {
            var service = await _context.Services.FindAsync(id); 
            if (service == null) 
            {
                await LogBothAsync("Delete", "Failed", $"Service not found for ID: {id}");
                return NotFound(); 
            }

            _context.Services.Remove(service); 
            await _context.SaveChangesAsync(); 

            await LogBothAsync(
                "Delete", 
                "Success", 
                $"Deleted Service:\n• Service ID -> {service.id}\n• Service Name -> {service.name}\n• Status -> {(service.status == 1 ? "Active" : "Inactive")}"
            );

            return NoContent(); 
        }
    }
}