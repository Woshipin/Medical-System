using System; // 【修复新增】引入系统基础命名空间，提供 DateTime 和异常支持
using System.Collections.Generic; // 【修复新增】引入通用集合命名空间，提供 List 支持
using System.Linq; // 【修复新增】引入 LINQ 命名空间
using System.Threading.Tasks; // 【修复新增】引入异步编程支持
using MedicalSystem.Data;     
using MedicalSystem.Models;   
using Microsoft.AspNetCore.Mvc; 
using Microsoft.EntityFrameworkCore; 
using MedicalSystem.Services; 

namespace MedicalSystem.Controllers 
{
    [Route("api/[controller]")] 
    [ApiController] 
    public class DepartmentController : ControllerBase 
    {
        private readonly AppDbContext _context; 
        private readonly IActivityLogService _activityLog; 

        public DepartmentController(AppDbContext context, IActivityLogService activityLog) 
        {
            _context = context; 
            _activityLog = activityLog; 
        }

        [HttpGet] 
        public async Task<ActionResult<IEnumerable<Department>>> GetDepartments() 
        {
            return await _context.Departments.ToListAsync(); 
        }

        [HttpPost] 
        public async Task<ActionResult<Department>> PostDepartment(Department department) 
        {
            _context.Departments.Add(department); 
            await _context.SaveChangesAsync(); 

            await _activityLog.LogAsync("Created", $"Created new Department:\n• Department ID -> {department.Id}\n• Department Name -> {department.Name}\n• Location -> {department.Location}\n• Status -> {(department.IsActive ? "Active" : "Inactive")}");

            return CreatedAtAction(nameof(GetDepartments), new { id = department.Id }, department); 
        }

        [HttpPut("{id}")] 
        public async Task<IActionResult> PutDepartment(int id, Department department) 
        {
            if (id != department.Id) return BadRequest(); 

            var existing = await _context.Departments.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id); 
            if (existing == null) return NotFound(); 

            var changes = new List<string>(); 
            if (existing.Name != department.Name) changes.Add($"• Department Name -> {existing.Name} ➔ {department.Name}"); 
            if (existing.Location != department.Location) changes.Add($"• Location -> {existing.Location} ➔ {department.Location}"); 
            if (existing.IsActive != department.IsActive) changes.Add($"• Status -> {(existing.IsActive ? "Active" : "Inactive")} ➔ {(department.IsActive ? "Active" : "Inactive")}"); 

            _context.Entry(department).State = EntityState.Modified; 

            try 
            { 
                await _context.SaveChangesAsync(); 

                string logDetails = changes.Any() 
                    ? $"Updated department (ID: {id}):\n{string.Join("\n", changes)}" 
                    : $"Updated department (ID: {id}):\n• No fields were modified."; 

                await _activityLog.LogAsync("Updated", logDetails); 
            } 
            catch (DbUpdateConcurrencyException) 
            {
                if (!_context.Departments.Any(e => e.Id == id)) return NotFound(); 
                else throw; 
            }
            return NoContent(); 
        }

        [HttpDelete("{id}")] 
        public async Task<IActionResult> DeleteDepartment(int id) 
        {
            var department = await _context.Departments.FindAsync(id); 
            if (department == null) return NotFound(); 

            _context.Departments.Remove(department); 
            await _context.SaveChangesAsync(); 

            await _activityLog.LogAsync("Deleted", $"Deleted Department:\n• Department ID -> {department.Id}\n• Department Name -> {department.Name}\n• Location -> {department.Location}\n• Status -> {(department.IsActive ? "Active" : "Inactive")}");

            return NoContent(); 
        }
    }
}