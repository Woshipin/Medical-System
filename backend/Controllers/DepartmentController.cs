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
    public class DepartmentController : ControllerBase 
    {
        private readonly AppDbContext _context; 
        private readonly IActivityLogService _activityLog; 
        private readonly ILogger<DepartmentController> _logger; 

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
        public async Task<IActionResult> GetDepartments() 
        {
            var data = await _context.Departments.ToListAsync(); 
            await LogBothAsync("Read", "Success", $"Retrieved {data.Count} departments.");
            return Ok(data); // 保持原列表返回结构，或采用 ApiResponse，根据前端消费情况定
        }

        [HttpPost] 
        public async Task<IActionResult> PostDepartment([FromBody] DepartmentDto model) 
        {
            // ModelState Data Annotations Validation Gate
            if (!ModelState.IsValid) 
            {
                var fieldErrors = ModelState
                    .Where(x => x.Value != null && x.Value.Errors.Count > 0)
                    .ToDictionary(
                        x => x.Key,
                        x => x.Value!.Errors.First().ErrorMessage
                    );

                await LogBothAsync("Create", "Failed", "Model validation failed.");
                return BadRequest(new { success = false, message = "Please fix the validation errors below.", errors = fieldErrors }); 
            }

            var department = new Department
            {
                name = model.Name,
                location = model.Location,
                status = model.Status
            };

            _context.Departments.Add(department); 
            await _context.SaveChangesAsync(); 

            await LogBothAsync(
                "Create", 
                "Success", 
                $"Created new Department:\n• Department ID -> {department.id}\n• Department Name -> {department.name}\n• Location -> {department.location}\n• Status -> {(department.status == 1 ? "Active" : "Inactive")}"
            );

            return Ok(new { success = true, message = "Department created successfully.", data = department }); 
        }

        [HttpPut("{id}")] 
        public async Task<IActionResult> PutDepartment(int id, [FromBody] DepartmentDto model) 
        {
            if (!ModelState.IsValid) 
            {
                var fieldErrors = ModelState
                    .Where(x => x.Value != null && x.Value.Errors.Count > 0)
                    .ToDictionary(
                        x => x.Key,
                        x => x.Value!.Errors.First().ErrorMessage
                    );

                await LogBothAsync("Update", "Failed", $"Model validation failed for department ID: {id}");
                return BadRequest(new { success = false, message = "Please fix the validation errors below.", errors = fieldErrors }); 
            }

            var existing = await _context.Departments.FirstOrDefaultAsync(d => d.id == id); 
            if (existing == null) 
            {
                await LogBothAsync("Update", "Failed", $"Department not found for ID: {id}");
                return NotFound(new { success = false, message = "Department not found." }); 
            }

            var changes = new List<string>(); 
            if (existing.name != model.Name) changes.Add($"• Department Name -> {existing.name} ➔ {model.Name}"); 
            if (existing.location != model.Location) changes.Add($"• Location -> {existing.location} ➔ {model.Location}"); 
            if (existing.status != model.Status) changes.Add($"• Status -> {(existing.status == 1 ? "Active" : "Inactive")} ➔ {(model.Status == 1 ? "Active" : "Inactive")}"); 

            existing.name = model.Name;
            existing.location = model.Location;
            existing.status = model.Status;

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
                    return NotFound(new { success = false, message = "Concurrency error. Department not found." }); 
                }
                else throw; 
            }

            return Ok(new { success = true, message = "Department updated successfully." }); 
        }

        [HttpDelete("{id}")] 
        public async Task<IActionResult> DeleteDepartment(int id) 
        {
            var department = await _context.Departments.FindAsync(id); 
            if (department == null) 
            {
                await LogBothAsync("Delete", "Failed", $"Department not found for ID: {id}");
                return NotFound(new { success = false, message = "Department not found." }); 
            }

            _context.Departments.Remove(department); 
            await _context.SaveChangesAsync(); 

            await LogBothAsync(
                "Delete", 
                "Success", 
                $"Deleted Department:\n• Department ID -> {department.id}\n• Department Name -> {department.name}\n• Location -> {department.location}\n• Status -> {(department.status == 1 ? "Active" : "Inactive")}"
            );

            return Ok(new { success = true, message = "Department deleted successfully." }); 
        }
    }

    public class DepartmentDto
    {
        [Required(ErrorMessage = "Department name is required.")]
        [StringLength(100, ErrorMessage = "Department name cannot exceed 100 characters.")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "Location is required.")]
        [StringLength(200, ErrorMessage = "Location cannot exceed 200 characters.")]
        public string Location { get; set; } = null!;

        [Required(ErrorMessage = "Operational status is required.")]
        public int Status { get; set; } = 1;
    }
}