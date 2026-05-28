using System; 
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks; 
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

        // 1. 鑾峰彇鎵€鏈夋€у埆鍒楄〃
        [HttpGet] 
        public async Task<IActionResult> GetAll() 
        {
            var data = await _context.Genders.ToListAsync(); 
            return Ok(ApiResponse<IEnumerable<Gender>>.SuccessResponse(data)); 
        }

        // 2. 鏍规嵁 ID 鑾峰彇鎬у埆璇︽儏 (鏂板)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var gender = await _context.Genders.FindAsync(id);
            if (gender == null) return NotFound(ApiResponse<object>.FailureResponse("操作失败"));
            return Ok(ApiResponse<Gender>.SuccessResponse(gender, "鎬у埆璁板綍鑾峰彇鎴愬姛"));
        }

        // 3. 鍒涘缓鎬у埆
        [HttpPost] 
        public async Task<IActionResult> Create(Gender gender) 
        {
            if (await _context.Genders.AnyAsync(g => g.name == gender.name)) 
                return BadRequest(ApiResponse<Gender>.FailureResponse("操作失败")); 

            _context.Genders.Add(gender); 
            await _context.SaveChangesAsync(); 

            // 銆愪慨鏀广€戯細鍒涘缓鏃ュ織涓鐘舵€佺殑鎻忚堪淇敼涓烘暣鍨嬬姸鎬佸垽瀹?(gender.status == 1)
            await _activityLog.LogAsync("Created", $"Created new Gender option:\n鈥?Gender ID -> {gender.id}\n鈥?Gender Name -> {gender.name}\n鈥?Status -> {(gender.status == 1 ? "Active" : "Inactive")}");

            return Ok(ApiResponse<Gender>.SuccessResponse(gender, "鎬у埆鍒涘缓鎴愬姛")); 
        }

        // 4. 鏇存柊鎬у埆 (鏂板)
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Gender gender)
        {
            if (id != gender.id) return BadRequest(ApiResponse<object>.FailureResponse("操作失败"));

            var existing = await _context.Genders.AsNoTracking().FirstOrDefaultAsync(g => g.id == id);
            if (existing == null) return NotFound(ApiResponse<object>.FailureResponse("操作失败"));

            var changes = new List<string>();
            if (existing.name != gender.name) changes.Add($"鈥?Gender Name -> {existing.name} 鉃?{gender.name}");
            if (existing.status != gender.status) changes.Add($"鈥?Status -> {(existing.status == 1 ? "Active" : "Inactive")} 鉃?{(gender.status == 1 ? "Active" : "Inactive")}");

            _context.Entry(gender).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();

                string logDetails = changes.Any()
                    ? $"Updated Gender details (ID: {id}):\n{string.Join("\n", changes)}"
                    : $"Updated Gender details (ID: {id}):\n鈥?No fields were modified.";

                await _activityLog.LogAsync("Updated", logDetails);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Genders.Any(e => e.id == id)) return NotFound(ApiResponse<object>.FailureResponse("操作失败"));
                else throw;
            }

            return Ok(ApiResponse<Gender>.SuccessResponse(gender, "鎬у埆璁板綍鏇存柊鎴愬姛"));
        }

        // 5. 鍒犻櫎鎬у埆
        [HttpDelete("{id}")] 
        public async Task<IActionResult> Delete(int id) 
        {
            var gender = await _context.Genders.FindAsync(id); 
            if (gender == null) return NotFound(ApiResponse<object>.FailureResponse("操作失败")); 

            bool isInUse = await _context.Users.AnyAsync(u => u.GenderId == id); 
            if (isInUse) return BadRequest(ApiResponse<object>.FailureResponse("操作失败")); 

            _context.Genders.Remove(gender); 
            await _context.SaveChangesAsync(); 

            // 銆愪慨鏀广€戯細鍒犻櫎鏃ュ織涓鐘舵€佺殑鎻忚堪淇敼涓烘暣鍨嬬姸鎬佸垽瀹?(gender.status == 1)
            await _activityLog.LogAsync("Deleted", $"Deleted Gender option:\n鈥?Gender ID -> {gender.id}\n鈥?Gender Name -> {gender.name}\n鈥?Status -> {(gender.status == 1 ? "Active" : "Inactive")}");

            return Ok(ApiResponse<object>.SuccessResponse(null, "操作成功")); 
        }
    }
}


