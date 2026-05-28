using System; 
using System.Collections.Generic; 
using System.Linq; 
using System.Threading.Tasks; 
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

            // 【修改】：使用 (department.status == 1) 判定是否启用
            await _activityLog.LogAsync("Created", $"Created new Department:\n• Department ID -> {department.id}\n• Department Name -> {department.name}\n• Location -> {department.location}\n• Status -> {(department.status == 1 ? "Active" : "Inactive")}");

            return CreatedAtAction(nameof(GetDepartments), new { id = department.id }, department); 
        }

        [HttpPut("{id}")] 
        public async Task<IActionResult> PutDepartment(int id, Department department) 
        {
            if (id != department.id) return BadRequest(); 

            var existing = await _context.Departments.AsNoTracking().FirstOrDefaultAsync(d => d.id == id); 
            if (existing == null) return NotFound(); 

            var changes = new List<string>(); 
            if (existing.name != department.name) changes.Add($"• Department Name -> {existing.name} ➔ {department.name}"); 
            if (existing.location != department.location) changes.Add($"• Location -> {existing.location} ➔ {department.location}"); 
            
            // 【修改】：将状态比对和日志记录修改为兼容整型状态 (1 = Active, 0 = Inactive)
            if (existing.status != department.status) changes.Add($"• Status -> {(existing.status == 1 ? "Active" : "Inactive")} ➔ {(department.status == 1 ? "Active" : "Inactive")}"); 

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
                if (!_context.Departments.Any(e => e.id == id)) return NotFound(); 
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

            // 【修改】：删除记录时的日志输出修改为整型状态判定
            await _activityLog.LogAsync("Deleted", $"Deleted Department:\n• Department ID -> {department.id}\n• Department Name -> {department.name}\n• Location -> {department.location}\n• Status -> {(department.status == 1 ? "Active" : "Inactive")}");

            return NoContent(); 
        }
    }
}