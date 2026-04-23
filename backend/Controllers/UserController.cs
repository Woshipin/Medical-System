using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MedicalSystem.Models;

namespace MedicalSystem.Controllers
{
    [Authorize(Roles = "SuperAdmin, Admin")]
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly UserManager<User> _userManager;

        public UserController(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        // 获取全部用户
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userManager.Users.OrderBy(u => u.Id).ToListAsync();
            return Ok(ApiResponse<IEnumerable<User>>.SuccessResponse(users));
        }

        // 修改用户信息
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UserUpdateDto model)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null) return NotFound(ApiResponse<string>.FailureResponse("未找到用户"));

            user.FullName = model.FullName;
            user.Email = model.Email;
            user.UserName = model.Email; 
            user.PhoneNumber = model.PhoneNumber;
            user.GenderId = model.GenderId;
            user.Role = model.Role;
            user.IsActive = model.IsActive;

            var result = await _userManager.UpdateAsync(user);
            if (result.Succeeded) return Ok(ApiResponse<string>.SuccessResponse(null, "更新成功"));
            return BadRequest(ApiResponse<string>.FailureResponse("更新失败"));
        }

        // 删除用户
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null) return NotFound();

            var result = await _userManager.DeleteAsync(user);
            if (result.Succeeded) return Ok(ApiResponse<string>.SuccessResponse(null, "删除成功"));
            return BadRequest(ApiResponse<string>.FailureResponse("删除失败"));
        }
    }

    public class UserUpdateDto {
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PhoneNumber { get; set; } = null!;
        public int GenderId { get; set; }
        public UserRole Role { get; set; }
        public bool IsActive { get; set; }
    }
}