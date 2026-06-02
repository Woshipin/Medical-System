using System; 
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks; 
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
        private readonly ILogger<GendersController> _logger; // 引入 Logger

        public GendersController(
            AppDbContext context, 
            IActivityLogService activityLog,
            ILogger<GendersController> logger) 
        { 
            _context = context; 
            _activityLog = activityLog; 
            _logger = logger;
        } 

        // 统一双写日志方法 (File + ActivityLog)
        private async Task LogBothAsync(string actionName, string status, string message)
        {
            _logger.LogInformation("[GendersController.{ActionName}] {Status}: {Message}", actionName, status, message);
            await _activityLog.LogAsync(actionName, $"[{status}] {message}");
        }

        // 1. 获取所有性别列表
        [HttpGet] 
        public async Task<IActionResult> GetAll() 
        {
            var data = await _context.Genders.ToListAsync(); 
            await LogBothAsync("Read", "Success", $"Retrieved {data.Count} gender options.");
            return Ok(ApiResponse<IEnumerable<Gender>>.SuccessResponse(data)); 
        }

        // 2. 根据 ID 获取性别详情
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var gender = await _context.Genders.FindAsync(id);
            if (gender == null) 
            {
                await LogBothAsync("Read", "Failed", $"Gender not found for ID: {id}");
                return NotFound(ApiResponse<string>.FailureResponse("Gender not found."));
            }
            
            await LogBothAsync("Read", "Success", $"Retrieved gender ID: {id}");
            return Ok(ApiResponse<Gender>.SuccessResponse(gender, "Gender retrieved successfully."));
        }

        // 3. 创建性别
        [HttpPost] 
        public async Task<IActionResult> Create(Gender gender) 
        {
            if (await _context.Genders.AnyAsync(g => g.name == gender.name)) 
            {
                await LogBothAsync("Create", "Failed", $"Gender name already exists: {gender.name}");
                return BadRequest(ApiResponse<string>.FailureResponse("Gender name already exists.")); 
            }

            _context.Genders.Add(gender); 
            await _context.SaveChangesAsync(); 

            await LogBothAsync(
                "Create", 
                "Success", 
                $"Created new Gender option:\n• Gender ID -> {gender.id}\n• Gender Name -> {gender.name}\n• Status -> {(gender.status == 1 ? "Active" : "Inactive")}"
            );

            return Ok(ApiResponse<Gender>.SuccessResponse(gender, "Gender created successfully.")); 
        }

        // 4. 更新性别
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Gender gender)
        {
            if (id != gender.id) 
            {
                await LogBothAsync("Update", "Failed", "ID mismatch in request.");
                return BadRequest(ApiResponse<string>.FailureResponse("Invalid request."));
            }

            var existing = await _context.Genders.AsNoTracking().FirstOrDefaultAsync(g => g.id == id);
            if (existing == null) 
            {
                await LogBothAsync("Update", "Failed", $"Gender not found for ID: {id}");
                return NotFound(ApiResponse<string>.FailureResponse("Gender not found."));
            }

            var changes = new List<string>();
            if (existing.name != gender.name) changes.Add($"• Gender Name -> {existing.name} ➔ {gender.name}");
            if (existing.status != gender.status) changes.Add($"• Status -> {(existing.status == 1 ? "Active" : "Inactive")} ➔ {(gender.status == 1 ? "Active" : "Inactive")}");

            _context.Entry(gender).State = EntityState.Modified;

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
                    return NotFound(ApiResponse<string>.FailureResponse("Gender not found."));
                }
                else throw;
            }

            return Ok(ApiResponse<Gender>.SuccessResponse(gender, "Gender updated successfully."));
        }

        // 5. 删除性别
        [HttpDelete("{id}")] 
        public async Task<IActionResult> Delete(int id) 
        {
            var gender = await _context.Genders.FindAsync(id); 
            if (gender == null) 
            {
                await LogBothAsync("Delete", "Failed", $"Gender not found for ID: {id}");
                return NotFound(ApiResponse<string>.FailureResponse("Gender not found.")); 
            }

            bool isInUse = await _context.Users.AnyAsync(u => u.GenderId == id); 
            if (isInUse) 
            {
                await LogBothAsync("Delete", "Failed", $"Cannot delete gender ID: {id}. It is currently in use.");
                return BadRequest(ApiResponse<string>.FailureResponse("Cannot delete: Gender is currently assigned to users.")); 
            }

            _context.Genders.Remove(gender); 
            await _context.SaveChangesAsync(); 

            await LogBothAsync(
                "Delete", 
                "Success", 
                $"Deleted Gender option:\n• Gender ID -> {gender.id}\n• Gender Name -> {gender.name}\n• Status -> {(gender.status == 1 ? "Active" : "Inactive")}"
            );

            return Ok(ApiResponse<string>.SuccessResponse(null, "Gender deleted successfully.")); 
        }
    }
}