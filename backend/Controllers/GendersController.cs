using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MedicalSystem.Data;
using MedicalSystem.Models;

namespace MedicalSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GendersController : ControllerBase
    {
        private readonly AppDbContext _context;
        public GendersController(AppDbContext context) { _context = context; }

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
                return BadRequest(ApiResponse<Gender>.FailureResponse("性别名称已存在"));

            _context.Genders.Add(gender);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<Gender>.SuccessResponse(gender, "创建成功"));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Gender input)
        {
            var gender = await _context.Genders.FindAsync(id);
            if (gender == null) return NotFound(ApiResponse<Gender>.FailureResponse("未找到记录"));

            gender.Name = input.Name;
            gender.IsActive = input.IsActive;
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<Gender>.SuccessResponse(gender, "更新成功"));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var gender = await _context.Genders.FindAsync(id);
            if (gender == null) return NotFound(ApiResponse<object>.FailureResponse("记录不存在"));

            // --- 修正点：现在 GenderId 是在 User 表里，所以去 User 表查是否有人在使用这个性别 ---
            bool isInUse = await _context.Users.AnyAsync(u => u.GenderId == id);
            if (isInUse) return BadRequest(ApiResponse<object>.FailureResponse("该性别正在被使用，无法删除"));

            _context.Genders.Remove(gender);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null!, "删除成功"));
        }
    }
}