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
            // 防止重复性别名称
            if (await _context.Genders.AnyAsync(g => g.Name == gender.Name))
                return BadRequest(ApiResponse<Gender>.FailureResponse("该性别名称已存在"));

            _context.Genders.Add(gender);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<Gender>.SuccessResponse(gender, "性别创建成功"));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var gender = await _context.Genders.FindAsync(id);
            if (gender == null) return NotFound(ApiResponse<object>.FailureResponse("记录不存在"));

            // 商用逻辑：如果 Users 表中有人使用该性别，则不允许删除
            bool isInUse = await _context.Users.AnyAsync(u => u.GenderId == id);
            if (isInUse) return BadRequest(ApiResponse<object>.FailureResponse("操作取消：有用户正关联此性别，无法删除"));

            _context.Genders.Remove(gender);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null, "性别记录已成功删除"));
        }
    }
}