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
    public class OfficeLocationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly IActivityLogService _activityLog;
        private readonly ILogger<OfficeLocationController> _logger;

        public OfficeLocationController(
            AppDbContext context, 
            UserManager<User> userManager, 
            IActivityLogService activityLog,
            ILogger<OfficeLocationController> logger)
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
            var list = await _context.OfficeLocations.OrderByDescending(o => o.id).ToListAsync();
            return Ok(ApiResponse<IEnumerable<OfficeLocation>>.SuccessResponse(list, "璇婂鍒楄〃鎻愬彇鎴愬姛"));
        }

        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveList()
        {
            _logger.LogInformation("执行请求");
            var list = await _context.OfficeLocations.Where(o => o.status == 1).OrderBy(o => o.name).ToListAsync();
            return Ok(ApiResponse<IEnumerable<OfficeLocation>>.SuccessResponse(list, "鍙敤璇婂浣嶇疆鍒楄〃鍔犺浇鎴愬姛"));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            _logger.LogInformation("鎷夊彇璇婂浣嶇疆璇︽儏锛孖D 缂栧彿: {Id}", id);
            var location = await _context.OfficeLocations.FindAsync(id);
            if (location == null)
            {
                return NotFound(ApiResponse<object>.FailureResponse("操作失败"));
            }
            return Ok(ApiResponse<OfficeLocation>.SuccessResponse(location, "璇婂浣嶇疆淇℃伅鎻愬彇鎴愬姛"));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] OfficeLocation model)
        {
            if (!ModelState.IsValid)
            {
                var validationErrors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<object>.FailureResponse("鏁版嵁杈撳叆鏍煎紡鏈夎", validationErrors));
            }

            var exists = await _context.OfficeLocations.AnyAsync(o => o.name == model.name.Trim());
            if (exists)
            {
                return BadRequest(ApiResponse<object>.FailureResponse("宸插瓨鍦ㄧ浉鍚岀殑鐗╃悊闂ㄧ墝/璇婂鐧昏璁板綍"));
            }

            var location = new OfficeLocation
            {
                name = model.name.Trim(),
                status = model.status,
                created_at = DateTime.Now,
                updated_at = DateTime.Now
            };

            _context.OfficeLocations.Add(location);
            await _context.SaveChangesAsync();
            _logger.LogInformation("璇婂鐧昏瀹屾垚锛岀敓鎴愪富閿? {Id}", location.id);

            var op = await GetCurrentOperatorAsync();
            await _activityLog.LogExplicitAsync(
                op.id, 
                op.name, 
                op.role, 
                "CreateOfficeLocation", 
                $"娣诲姞浜嗘柊鐨勮瘖瀹や綅缃?\n鈥?ID -> {location.id}\n鈥?浣嶇疆鍚嶇О -> {location.name}\n鈥?鍒濆鐘舵€?-> {(location.status == 1 ? "鍚敤" : "鍋滅敤")}"
            );

            return Ok(ApiResponse<OfficeLocation>.SuccessResponse(location, "璇婂璁板綍娣诲姞鎴愬姛"));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] OfficeLocation model)
        {
            if (id != model.id)
            {
                return BadRequest(ApiResponse<object>.FailureResponse("操作失败"));
            }

            if (!ModelState.IsValid)
            {
                var validationErrors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<object>.FailureResponse("淇℃伅鏁版嵁绾︽潫鏈€氳繃", validationErrors));
            }

            var location = await _context.OfficeLocations.FindAsync(id);
            if (location == null)
            {
                return NotFound(ApiResponse<object>.FailureResponse("操作失败"));
            }

            var exists = await _context.OfficeLocations.AnyAsync(o => o.name == model.name.Trim() && o.id != id);
            if (exists)
            {
                return BadRequest(ApiResponse<object>.FailureResponse("鍛藉悕鍐茬獊锛氭柊褰曞叆鐨勭┖闂村湴鍧€宸茶鍗犵敤"));
            }

            string oldName = location.name;
            int oldStatus = location.status;

            location.name = model.name.Trim();
            location.status = model.status;
            location.updated_at = DateTime.Now;

            await _context.SaveChangesAsync();
            _logger.LogInformation("璇婂璁板綍淇敼鎴愬姛銆侷D: {Id}", id);

            var op = await GetCurrentOperatorAsync();
            await _activityLog.LogExplicitAsync(
                op.id, 
                op.name, 
                op.role, 
                "UpdateOfficeLocation", 
                $"鏇存柊浜嗚瘖瀹や俊鎭?(ID: {id}):\n鈥?鍘熶綅缃? {oldName} -> 鏂颁綅缃? {location.name}\n鈥?鍘熺姸鎬? {(oldStatus == 1 ? "鍚敤" : "鍋滅敤")} -> 鏂扮姸鎬? {(location.status == 1 ? "鍚敤" : "鍋滅敤")}"
            );

            return Ok(ApiResponse<OfficeLocation>.SuccessResponse(location, "操作成功"));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var location = await _context.OfficeLocations.FindAsync(id);
            if (location == null)
            {
                return NotFound(ApiResponse<object>.FailureResponse("鍑嗗鍒犻櫎鐨勮瘖瀹ゅ彲鑳芥棭宸茶绉诲幓"));
            }

            var hasDoctors = await _context.Doctors.AnyAsync(d => d.OfficeLocationId == id);
            if (hasDoctors)
            {
                return BadRequest(ApiResponse<object>.FailureResponse("操作失败"));
            }

            _context.OfficeLocations.Remove(location);
            await _context.SaveChangesAsync();
            _logger.LogInformation("鐗╃悊鍒犻櫎绌洪棿鍦板潃瀹屾垚锛孖D 涓? {Id}", id);

            var op = await GetCurrentOperatorAsync();
            await _activityLog.LogExplicitAsync(
                op.id, 
                op.name, 
                op.role, 
                "DeleteOfficeLocation", 
                $"娓呴櫎浜嗚瘖瀹や綅缃」:\n鈥?ID -> {location.id}\n鈥?浣嶇疆鍚嶇О -> {location.name}"
            );

            return Ok(ApiResponse<object>.SuccessResponse(null, "鎴愬姛鍒犻櫎璇婂浣嶇疆璁板綍"));
        }
    }
}



