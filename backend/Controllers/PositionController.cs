using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.IdentityModel.Tokens.Jwt;
using MedicalSystem.Data;
using MedicalSystem.Models;
using MedicalSystem.Services;

namespace MedicalSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PositionController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly IActivityLogService _activityLog;
        private readonly ILogger<PositionController> _logger;

        public PositionController(
            AppDbContext context, 
            UserManager<User> userManager, 
            IActivityLogService activityLog,
            ILogger<PositionController> logger)
        {
            _context = context;
            _userManager = userManager;
            _activityLog = activityLog;
            _logger = logger;
        }

        private async Task<(int? id, string name, string role)> GetCurrentOperatorAsync()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!string.IsNullOrEmpty(userIdStr))
            {
                var user = await _userManager.FindByIdAsync(userIdStr);
                if (user != null)
                {
                    return (user.Id, user.FullName ?? "Unknown", user.Role.ToString() ?? "Visitor");
                }
            }
            return (null, "System/Unknown", "Visitor");
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            _logger.LogInformation("执行获取全部职位请求");
            var list = await _context.Positions.OrderByDescending(p => p.id).ToListAsync();
            return Ok(ApiResponse<IEnumerable<Position>>.SuccessResponse(list, "职位列表获取成功"));
        }

        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveList()
        {
            _logger.LogInformation("执行获取启用职位请求");
            var list = await _context.Positions.Where(p => p.status == 1).OrderBy(p => p.id).ToListAsync();
            return Ok(ApiResponse<IEnumerable<Position>>.SuccessResponse(list, "可用职位列表获取成功"));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            _logger.LogInformation("读取特定职位数据，ID 为: {Id}", id);
            var position = await _context.Positions.FindAsync(id);
            if (position == null)
            {
                return NotFound(ApiResponse<object>.FailureResponse("职位信息未检索到"));
            }
            return Ok(ApiResponse<Position>.SuccessResponse(position, "职位数据获取成功"));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Position model)
        {
            if (!ModelState.IsValid)
            {
                var validationErrors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<object>.FailureResponse("请求格式校验失败", validationErrors));
            }

            var exists = await _context.Positions.AnyAsync(p => p.name == model.name.Trim());
            if (exists)
            {
                return BadRequest(ApiResponse<object>.FailureResponse("该职位名称已设定过，不能重复创建"));
            }

            var position = new Position
            {
                name = model.name.Trim(),
                status = model.status,
                created_at = DateTime.UtcNow,
                updated_at = DateTime.UtcNow
            };

            _context.Positions.Add(position);
            await _context.SaveChangesAsync();
            _logger.LogInformation("写入职位成功，实体名称: {Name}, 自动绑定 ID: {Id}", position.name, position.id);

            var op = await GetCurrentOperatorAsync();
            await _activityLog.LogExplicitAsync(
                op.id, 
                op.name, 
                op.role, 
                "CreatePosition", 
                $"创建了新职位:\n• ID -> {position.id}\n• 职位名称 -> {position.name}\n• 初始状态 -> {(position.status == 1 ? "启用" : "停用")}"
            );

            return Ok(ApiResponse<Position>.SuccessResponse(position, "职位创建成功"));
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Position model)
        {
            if (id != model.id)
            {
                return BadRequest(ApiResponse<object>.FailureResponse("传入的资源主键标识不契合"));
            }

            if (!ModelState.IsValid)
            {
                var validationErrors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<object>.FailureResponse("请求实体参数异常", validationErrors));
            }

            var position = await _context.Positions.FindAsync(id);
            if (position == null)
            {
                return NotFound(ApiResponse<object>.FailureResponse("操作失败"));
            }

            var exists = await _context.Positions.AnyAsync(p => p.name == model.name.Trim() && p.id != id);
            if (exists)
            {
                return BadRequest(ApiResponse<object>.FailureResponse("系统内已有重名的职位配置项目"));
            }

            string oldName = position.name;
            int oldStatus = position.status;

            position.name = model.name.Trim();
            position.status = model.status;
            position.updated_at = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            _logger.LogInformation("更新职位操作成功。标识 ID: {Id}", id);

            var op = await GetCurrentOperatorAsync();
            await _activityLog.LogExplicitAsync(
                op.id, 
                op.name, 
                op.role, 
                "UpdatePosition", 
                $"更新了职位信息 (ID: {id}):\n• 原职位: {oldName} -> 新职位: {position.name}\n• 原状态: {(oldStatus == 1 ? "启用" : "停用")} -> 新状态: {(position.status == 1 ? "启用" : "停用")}"
            );

            return Ok(ApiResponse<Position>.SuccessResponse(position, "职位数据修改成功"));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var position = await _context.Positions.FindAsync(id);
            if (position == null)
            {
                return NotFound(ApiResponse<object>.FailureResponse("操作失败"));
            }

            // 联动检查：在 Doctor 数据表中将 `TitleId` 替换为了 `PositionId`
            var hasDoctors = await _context.Doctors.AnyAsync(d => d.PositionId == id);
            if (hasDoctors)
            {
                return BadRequest(ApiResponse<object>.FailureResponse("操作失败，当前职位正在被医生账号使用"));
            }

            _context.Positions.Remove(position);
            await _context.SaveChangesAsync();
            _logger.LogInformation("物理移除职位成功，目标 ID: {Id}", id);

            var op = await GetCurrentOperatorAsync();
            await _activityLog.LogExplicitAsync(
                op.id, 
                op.name, 
                op.role, 
                "DeletePosition", 
                $"删除了职位项:\n• ID -> {position.id}\n• 名称 -> {position.name}"
            );

            return Ok(ApiResponse<object>.SuccessResponse(null, "职位删除成功"));
        }
    }
}