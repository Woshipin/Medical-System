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
    public class SpecialtyController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly IActivityLogService _activityLog;
        private readonly ILogger<SpecialtyController> _logger;

        public SpecialtyController(
            AppDbContext context, 
            UserManager<User> userManager, 
            IActivityLogService activityLog,
            ILogger<SpecialtyController> logger)
        {
            _context = context;
            _userManager = userManager;
            _activityLog = activityLog;
            _logger = logger;
        }

        // 銆愭牳蹇冧慨澶嶃€戯細涓洪槻姝㈢紪璇戣鍛?CS8619锛屽湪姝ゅ鏄惧紡璧嬩簣瀹夊叏鐨勫瓧绗︿覆榛樿鍊间互鍖归厤 (int?, string, string) 鐨勭鍚?
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
            var list = await _context.Specialties.OrderByDescending(s => s.id).ToListAsync();
            return Ok(ApiResponse<IEnumerable<Specialty>>.SuccessResponse(list, "涓撶鍒楄〃鑾峰彇鎴愬姛"));
        }

        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveList()
        {
            _logger.LogInformation("执行请求");
            var list = await _context.Specialties.Where(s => s.status == 1).OrderBy(s => s.name).ToListAsync();
            return Ok(ApiResponse<IEnumerable<Specialty>>.SuccessResponse(list, "鍙敤涓撶鍒楄〃鑾峰彇鎴愬姛"));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            _logger.LogInformation("鏌ヨ涓撶璁板綍璇︽儏锛屾煡璇?ID 鍊间负: {Id}", id);
            var specialty = await _context.Specialties.FindAsync(id);
            if (specialty == null)
            {
                _logger.LogWarning("鏈绱㈠埌涓撶璁板綍銆傛煡璇?ID: {Id}", id);
                return NotFound(ApiResponse<object>.FailureResponse("鎸囧畾鐨勪笓绉戞湭鎵惧埌"));
            }
            return Ok(ApiResponse<Specialty>.SuccessResponse(specialty, "涓撶璇︽儏鑾峰彇鎴愬姛"));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Specialty model)
        {
            if (!ModelState.IsValid)
            {
                var validationErrors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<object>.FailureResponse("杈撳叆鏁版嵁楠岃瘉鏈€氳繃", validationErrors));
            }

            var exists = await _context.Specialties.AnyAsync(s => s.name == model.name.Trim());
            if (exists)
            {
                return BadRequest(ApiResponse<object>.FailureResponse("璇ヤ笓绉戝悕绉板湪鏁版嵁搴撲腑宸插瓨鍦紝涓嶈兘閲嶅褰曞叆"));
            }

            var specialty = new Specialty
            {
                name = model.name.Trim(),
                status = model.status,
                created_at = DateTime.Now,
                updated_at = DateTime.Now
            };

            _context.Specialties.Add(specialty);
            await _context.SaveChangesAsync();
            _logger.LogInformation("绯荤粺宸叉垚鍔熸寔涔呭寲涓撶璁板綍: '{Name}'锛屽垎閰嶇殑涓婚敭 ID: {Id}", specialty.name, specialty.id);

            var op = await GetCurrentOperatorAsync();
            await _activityLog.LogExplicitAsync(
                op.id, 
                op.name, 
                op.role, 
                "CreateSpecialty", 
                $"鍒涘缓浜嗘柊涓撶:\n鈥?璁板綍 ID -> {specialty.id}\n鈥?涓撶鍚嶇О -> {specialty.name}\n鈥?鐘舵€?-> {(specialty.status == 1 ? "鍚敤" : "鍋滅敤")}"
            );

            return Ok(ApiResponse<Specialty>.SuccessResponse(specialty, "涓撶娣诲姞鎴愬姛"));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Specialty model)
        {
            if (id != model.id)
            {
                return BadRequest(ApiResponse<object>.FailureResponse("操作失败"));
            }

            if (!ModelState.IsValid)
            {
                var validationErrors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return BadRequest(ApiResponse<object>.FailureResponse("妯″瀷瑙勮寖鏍￠獙澶辫触", validationErrors));
            }

            var specialty = await _context.Specialties.FindAsync(id);
            if (specialty == null)
            {
                return NotFound(ApiResponse<object>.FailureResponse("鏈兘妫€绱㈠埌寰呯紪杈戠殑鐩爣涓撶璁板綍"));
            }

            var nameDuplicated = await _context.Specialties.AnyAsync(s => s.name == model.name.Trim() && s.id != id);
            if (nameDuplicated)
            {
                return BadRequest(ApiResponse<object>.FailureResponse("鏂颁慨鏀圭殑涓撶鍚嶇О鍦ㄧ郴缁熶腑宸茶鍗犵敤"));
            }

            string oldName = specialty.name;
            int oldStatus = specialty.status;

            specialty.name = model.name.Trim();
            specialty.status = model.status;
            specialty.updated_at = DateTime.Now;

            await _context.SaveChangesAsync();
            _logger.LogInformation("涓撶璁板綍瀹屾垚鏇存柊锛屾搷浣?ID: {Id}", id);

            var op = await GetCurrentOperatorAsync();
            await _activityLog.LogExplicitAsync(
                op.id, 
                op.name, 
                op.role, 
                "UpdateSpecialty", 
                $"淇敼浜嗕笓绉戜俊鎭?(ID: {id}):\n鈥?鍘熷悕绉? {oldName} -> 鏂板悕绉? {specialty.name}\n鈥?鍘熺姸鎬? {(oldStatus == 1 ? "鍚敤" : "鍋滅敤")} -> 鏂扮姸鎬? {(specialty.status == 1 ? "鍚敤" : "鍋滅敤")}"
            );

            return Ok(ApiResponse<Specialty>.SuccessResponse(specialty, "涓撶淇敼鎴愬姛"));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var specialty = await _context.Specialties.FindAsync(id);
            if (specialty == null)
            {
                return NotFound(ApiResponse<object>.FailureResponse("操作失败"));
            }

            var hasDoctors = await _context.Doctors.AnyAsync(d => d.SpecialtyId == id);
            if (hasDoctors)
            {
                _logger.LogWarning("鎷︽埅涓撶纭垹闄ゃ€侷D: {Id}锛屽凡鏈夊湪鑱屽尰鐢熶緷璧栨瀹炰綋", id);
                return BadRequest(ApiResponse<object>.FailureResponse("操作失败"));
            }

            _context.Specialties.Remove(specialty);
            await _context.SaveChangesAsync();
            _logger.LogInformation("涓撶璁板綍鎵ц鐗╃悊鎿﹂櫎鎴愬姛锛屽師 ID 鍊间负: {Id}", id);

            var op = await GetCurrentOperatorAsync();
            await _activityLog.LogExplicitAsync(
                op.id, 
                op.name, 
                op.role, 
                "DeleteSpecialty", 
                $"娓呴櫎浜嗕笓绉戞暟鎹?\n鈥?ID -> {specialty.id}\n鈥?涓撶鍚嶇О -> {specialty.name}"
            );

            return Ok(ApiResponse<object>.SuccessResponse(null, "操作成功"));
        }
    }
}



