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
    public class DepartmentController : ControllerBase 
    {
        private readonly AppDbContext _context; 
        private readonly IActivityLogService _activityLog; 
        private readonly ILogger<DepartmentController> _logger; // 引入 Logger 

        public DepartmentController(
            AppDbContext context, 
            IActivityLogService activityLog,
            ILogger<DepartmentController> logger) 
        {
            _context = context; 
            _activityLog = activityLog; 
            _logger = logger;
        }

        // 统一双写日志方法 (File + ActivityLog)
        private async Task LogBothAsync(string actionName, string status, string message)
        {
            _logger.LogInformation("[DepartmentController.{ActionName}] {Status}: {Message}", actionName, status, message);
            await _activityLog.LogAsync(actionName, $"[{status}] {message}");
        }

        [HttpGet] 
        public async Task<ActionResult<IEnumerable<Department>>> GetDepartments() 
        {
            var data = await _context.Departments.ToListAsync(); 
            await LogBothAsync("Read", "Success", $"Retrieved {data.Count} departments.");
            return data;
        }

        [HttpPost] 
        public async Task<ActionResult<Department>> PostDepartment(Department department) 
        {
            _context.Departments.Add(department); 
            await _context.SaveChangesAsync(); 

            await LogBothAsync(
                "Create", 
                "Success", 
                $"Created new Department:\n• Department ID -> {department.id}\n• Department Name -> {department.name}\n• Location -> {department.location}\n• Status -> {(department.status == 1 ? "Active" : "Inactive")}"
            );

            return CreatedAtAction(nameof(GetDepartments), new { id = department.id }, department); 
        }

        [HttpPut("{id}")] 
        public async Task<IActionResult> PutDepartment(int id, Department department) 
        {
            if (id != department.id) 
            {
                await LogBothAsync("Update", "Failed", "ID mismatch in request.");
                return BadRequest(); 
            }

            var existing = await _context.Departments.AsNoTracking().FirstOrDefaultAsync(d => d.id == id); 
            if (existing == null) 
            {
                await LogBothAsync("Update", "Failed", $"Department not found for ID: {id}");
                return NotFound(); 
            }

            var changes = new List<string>(); 
            if (existing.name != department.name) changes.Add($"• Department Name -> {existing.name} ➔ {department.name}"); 
            if (existing.location != department.location) changes.Add($"• Location -> {existing.location} ➔ {department.location}"); 
            if (existing.status != department.status) changes.Add($"• Status -> {(existing.status == 1 ? "Active" : "Inactive")} ➔ {(department.status == 1 ? "Active" : "Inactive")}"); 

            _context.Entry(department).State = EntityState.Modified; 

            try 
            { 
                await _context.SaveChangesAsync(); 

                string logDetails = changes.Any() 
                    ? $"Updated department (ID: {id}):\n{string.Join("\n", changes)}" 
                    : $"Updated department (ID: {id}):\n• No fields were modified."; 

                await LogBothAsync("Update", "Success", logDetails); 
            } 
            catch (DbUpdateConcurrencyException) 
            {
                if (!_context.Departments.Any(e => e.id == id)) 
                {
                    await LogBothAsync("Update", "Failed", $"Concurrency error: Department {id} not found.");
                    return NotFound(); 
                }
                else throw; 
            }
            return NoContent(); 
        }

        [HttpDelete("{id}")] 
        public async Task<IActionResult> DeleteDepartment(int id) 
        {
            var department = await _context.Departments.FindAsync(id); 
            if (department == null) 
            {
                await LogBothAsync("Delete", "Failed", $"Department not found for ID: {id}");
                return NotFound(); 
            }

            _context.Departments.Remove(department); 
            await _context.SaveChangesAsync(); 

            await LogBothAsync(
                "Delete", 
                "Success", 
                $"Deleted Department:\n• Department ID -> {department.id}\n• Department Name -> {department.name}\n• Location -> {department.location}\n• Status -> {(department.status == 1 ? "Active" : "Inactive")}"
            );

            return NoContent(); 
        }
    }
}