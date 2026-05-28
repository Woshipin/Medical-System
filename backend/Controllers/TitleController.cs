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
    public class TitleController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly IActivityLogService _activityLog;
        private readonly ILogger<TitleController> _logger;

        public TitleController(
            AppDbContext context, 
            UserManager<User> userManager, 
            IActivityLogService activityLog,
            ILogger<TitleController> logger)
        {
            _context = context;
            _userManager = userManager;
            _activityLog = activityLog;
            _logger = logger;
        }

        // 銆愭牳蹇冧慨澶嶃€戯細涓洪槻姝㈢紪璇戣鍛?CS8619锛屽湪姝ゅ鏄惧紡瀹氫箟瀹夊叏鐨勫瓧绗︿覆榛樿鍊间互鍖归厤 (int?, string, string) 鐨勭鍚?
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
            _logger.LogInformation("执行请求");
            var list = await _context.Titles.OrderByDescending(t => t.id).ToListAsync();
            return Ok(ApiResponse<IEnumerable<Title>>.SuccessResponse(list, "鑱岀О鍒楄〃鑾峰彇鎴愬姛"));
        }

        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveList()
        {
            _logger.LogInformation("执行请求");
            var list = await _context.Titles.Where(t => t.status == 1).OrderBy(t => t.id).ToListAsync();
            return Ok(ApiResponse<IEnumerable<Title>>.SuccessResponse(list, "鍙敤鑱岀О鍒楄〃鑾峰彇鎴愬姛"));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            _logger.LogInformation("璇诲彇鐗瑰畾鑱岀О鏁版嵁锛孖D 涓? {Id}", id);
            var title = await _context.Titles.FindAsync(id);
            if (title == null)
            {
                return NotFound(ApiResponse<object>.FailureResponse("鑱岀О淇℃伅鏈绱㈠埌"));
            }
            return Ok(ApiResponse<Title>.SuccessResponse(title, "鑱岀О鏁版嵁鑾峰彇鎴愬姛"));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Title model)
        {
            if (!ModelState.IsValid)
            {
                var validationErrors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<object>.FailureResponse("璇锋眰鏍煎紡鏍￠獙澶辫触", validationErrors));
            }

            var exists = await _context.Titles.AnyAsync(t => t.name == model.name.Trim());
            if (exists)
            {
                return BadRequest(ApiResponse<object>.FailureResponse("璇ヨ亴绉扮О璋撳凡璁惧畾杩囷紝涓嶈兘閲嶅鍒涘缓"));
            }

            var title = new Title
            {
                name = model.name.Trim(),
                status = model.status,
                created_at = DateTime.Now,
                updated_at = DateTime.Now
            };

            _context.Titles.Add(title);
            await _context.SaveChangesAsync();
            _logger.LogInformation("鍐欏叆鑱岀О鎴愬姛锛屽疄浣撳悕绉? {Name}, 鑷姩缁戝畾 ID: {Id}", title.name, title.id);

            var op = await GetCurrentOperatorAsync();
            await _activityLog.LogExplicitAsync(
                op.id, 
                op.name, 
                op.role, 
                "CreateTitle", 
                $"鍒涘缓浜嗘柊鑱岀О:\n鈥?ID -> {title.id}\n鈥?鑱岀О鍚嶇О -> {title.name}\n鈥?鍒濆鐘舵€?-> {(title.status == 1 ? "鍚敤" : "鍋滅敤")}"
            );

            return Ok(ApiResponse<Title>.SuccessResponse(title, "鑱岀О鍒涘缓鎴愬姛"));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Title model)
        {
            if (id != model.id)
            {
                return BadRequest(ApiResponse<object>.FailureResponse("浼犲叆鐨勮祫婧愪富閿爣璇嗕笉濂戝悎"));
            }

            if (!ModelState.IsValid)
            {
                var validationErrors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<object>.FailureResponse("璇锋眰瀹炰綋鍙傛暟寮傚父", validationErrors));
            }

            var title = await _context.Titles.FindAsync(id);
            if (title == null)
            {
                return NotFound(ApiResponse<object>.FailureResponse("操作失败"));
            }

            var exists = await _context.Titles.AnyAsync(t => t.name == model.name.Trim() && t.id != id);
            if (exists)
            {
                return BadRequest(ApiResponse<object>.FailureResponse("绯荤粺鍐呭凡鏈夐噸鍚嶇殑鑱岀О閰嶇疆椤圭洰"));
            }

            string oldName = title.name;
            int oldStatus = title.status;

            title.name = model.name.Trim();
            title.status = model.status;
            title.updated_at = DateTime.Now;

            await _context.SaveChangesAsync();
            _logger.LogInformation("鏇存柊鑱岀О鎿嶄綔鎴愬姛銆傛爣璇?ID: {Id}", id);

            var op = await GetCurrentOperatorAsync();
            await _activityLog.LogExplicitAsync(
                op.id, 
                op.name, 
                op.role, 
                "UpdateTitle", 
                $"鏇存柊浜嗚亴绉颁俊鎭?(ID: {id}):\n鈥?鍘熻亴绉? {oldName} -> 鏂拌亴绉? {title.name}\n鈥?鍘熺姸鎬? {(oldStatus == 1 ? "鍚敤" : "鍋滅敤")} -> 鏂扮姸鎬? {(title.status == 1 ? "鍚敤" : "鍋滅敤")}"
            );

            return Ok(ApiResponse<Title>.SuccessResponse(title, "鑱岀О鏁版嵁淇敼鎴愬姛"));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var title = await _context.Titles.FindAsync(id);
            if (title == null)
            {
                return NotFound(ApiResponse<object>.FailureResponse("操作失败"));
            }

            var hasDoctors = await _context.Doctors.AnyAsync(d => d.TitleId == id);
            if (hasDoctors)
            {
                return BadRequest(ApiResponse<object>.FailureResponse("操作失败"));
            }

            _context.Titles.Remove(title);
            await _context.SaveChangesAsync();
            _logger.LogInformation("鐗╃悊绉婚櫎鑱岀О鎴愬姛锛岀洰鏍?ID: {Id}", id);

            var op = await GetCurrentOperatorAsync();
            await _activityLog.LogExplicitAsync(
                op.id, 
                op.name, 
                op.role, 
                "DeleteTitle", 
                $"鍒犻櫎浜嗚亴绉伴」:\n鈥?ID -> {title.id}\n鈥?鍚嶇О -> {title.name}"
            );

            return Ok(ApiResponse<object>.SuccessResponse(null, "鑱岀О鍒犻櫎鎴愬姛"));
        }
    }
}



