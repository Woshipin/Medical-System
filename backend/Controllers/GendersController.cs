using System; // 【修复新增】提供 DateTime 核心支持
using System.Threading.Tasks; // 【修复新增】提供 Task 支持
using Microsoft.AspNetCore.Mvc; 
using Microsoft.EntityFrameworkCore; 
using MedicalSystem.Data; 
using MedicalSystem.Models; 
using MedicalSystem.Services; 

namespace MedicalSystem.Controllers 
{
    [ApiController] 
    [Route("api/[controller]")] 
    public class GendersController : ControllerBase 
    {
        private readonly AppDbContext _context; 
        private readonly IActivityLogService _activityLog; 

        public GendersController(AppDbContext context, IActivityLogService activityLog) 
        { 
            _context = context; 
            _activityLog = activityLog; 
        } 

        [HttpGet] 
        public async Task<IActionResult> GetAll() 
        {
            var data = await _context.Genders.ToListAsync(); 
            return Ok(ApiResponse<IEnumerable<Gender>>.SuccessResponse(data)); 
        }

        [HttpPost] 
        public async Task<IActionResult> Create(Gender gender) 
        {
            if (await _context.Genders.AnyAsync(g => g.Name == gender.Name)) 
                return BadRequest(ApiResponse<Gender>.FailureResponse("该性别名称已存在")); 

            _context.Genders.Add(gender); 
            await _context.SaveChangesAsync(); 

            await _activityLog.LogAsync("Created", $"Created new Gender option:\n• Gender ID -> {gender.Id}\n• Gender Name -> {gender.Name}\n• Status -> {(gender.IsActive ? "Active" : "Inactive")}");

            return Ok(ApiResponse<Gender>.SuccessResponse(gender, "性别创建成功")); 
        }

        [HttpDelete("{id}")] 
        public async Task<IActionResult> Delete(int id) 
        {
            var gender = await _context.Genders.FindAsync(id); 
            if (gender == null) return NotFound(ApiResponse<object>.FailureResponse("记录不存在")); 

            bool isInUse = await _context.Users.AnyAsync(u => u.GenderId == id); 
            if (isInUse) return BadRequest(ApiResponse<object>.FailureResponse("操作取消：有用户正关联此性别，无法删除")); 

            _context.Genders.Remove(gender); 
            await _context.SaveChangesAsync(); 

            await _activityLog.LogAsync("Deleted", $"Deleted Gender option:\n• Gender ID -> {gender.Id}\n• Gender Name -> {gender.Name}\n• Status -> {(gender.IsActive ? "Active" : "Inactive")}");

            return Ok(ApiResponse<object>.SuccessResponse(null, "性别记录已成功删除")); 
        }
    }
}