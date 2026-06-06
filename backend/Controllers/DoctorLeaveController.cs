using MedicalSystem.Data;
using MedicalSystem.Models;
using MedicalSystem.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MedicalSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DoctorLeaveController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IActivityLogService _activityLog;
        private readonly ILogger<DoctorLeaveController> _logger;

        public DoctorLeaveController(
            AppDbContext context,
            IActivityLogService activityLog,
            ILogger<DoctorLeaveController> logger)
        {
            _context = context;
            _activityLog = activityLog;
            _logger = logger;
        }

        private async Task LogAsync(string action, string status, string message)
        {
            _logger.LogInformation("[DoctorLeave.{Action}] {Status}: {Message}", action, status, message);
            await _activityLog.LogAsync(action, $"[{status}] {message}");
        }

        // ================= DTO =================
        public class DoctorLeaveDto
        {
            public int DoctorId { get; set; }
            public int LeaveType { get; set; }
            public DateOnly StartDate { get; set; }
            public DateOnly EndDate { get; set; }
            public TimeOnly? StartTime { get; set; }
            public TimeOnly? EndTime { get; set; }
            public bool IsFullDay { get; set; } = true;
            public int Status { get; set; } = 0;
            public string? Reason { get; set; }
            public int? ApprovedBy { get; set; }
        }

        // ================= GET =================
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            // 加载 Approver 获取审核人
            var leaves = await _context.DoctorLeaves
                .Include(x => x.Approver) 
                .ToListAsync();

            var doctors = await _context.Doctors
                .Include(d => d.User)
                .ToListAsync();

            var resultList = new List<object>();

            foreach (var leave in leaves)
            {
                // 双向兼容：优先匹配 Doctor.Id，如果没有匹配到，则匹配 Doctor.UserId
                var doc = doctors.FirstOrDefault(d => d.Id == leave.DoctorId) 
                          ?? doctors.FirstOrDefault(d => d.UserId == leave.DoctorId);

                resultList.Add(new
                {
                    id = leave.Id,
                    doctorId = leave.DoctorId,
                    leaveType = (int)leave.LeaveType,
                    startDate = leave.StartDate.ToString("yyyy-MM-dd"),
                    endDate = leave.EndDate.ToString("yyyy-MM-dd"),
                    startTime = leave.StartTime?.ToString("HH:mm") ?? "", // 去除小数位
                    endTime = leave.EndTime?.ToString("HH:mm") ?? "",     // 去除小数位
                    isFullDay = leave.IsFullDay,
                    status = (int)leave.Status,
                    reason = leave.Reason,
                    approvedBy = leave.ApprovedBy,
                    approverName = leave.Approver?.FullName ?? "—", // 获取审核人姓名
                    doctor = doc != null ? new
                    {
                        id = doc.Id,
                        status = doc.Status,
                        user = doc.User != null ? new
                        {
                            id = doc.User.Id,
                            fullName = doc.User.FullName,
                            status = doc.User.Status
                        } : null
                    } : null
                });
            }

            await LogAsync("Read", "Success", $"Fetched {leaves.Count}");
            return Ok(resultList);
        }

        // ================= CREATE =================
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] DoctorLeaveDto model)
        {
            if (model.StartDate > model.EndDate)
                return BadRequest(new { message = "Invalid date range" });

            var leave = new DoctorLeave
            {
                DoctorId = model.DoctorId,
                LeaveType = (LeaveType)model.LeaveType,
                StartDate = model.StartDate,
                EndDate = model.EndDate,
                StartTime = model.StartTime,
                EndTime = model.EndTime,
                IsFullDay = model.IsFullDay,
                Status = (LeaveStatus)model.Status,
                Reason = model.Reason,
                ApprovedBy = model.ApprovedBy,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.DoctorLeaves.Add(leave);
            await _context.SaveChangesAsync();

            await LogAsync("Create", "Success", $"Leave created {leave.Id}");

            return Ok(new { success = true, data = leave });
        }

        // ================= UPDATE =================
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DoctorLeaveDto model)
        {
            var existing = await _context.DoctorLeaves.FindAsync(id);

            if (existing == null)
                return NotFound(new { message = "Not found" });

            existing.DoctorId = model.DoctorId;
            existing.LeaveType = (LeaveType)model.LeaveType;
            existing.StartDate = model.StartDate;
            existing.EndDate = model.EndDate;
            existing.StartTime = model.StartTime;
            existing.EndTime = model.EndTime;
            existing.IsFullDay = model.IsFullDay;
            existing.Status = (LeaveStatus)model.Status;
            existing.Reason = model.Reason;
            existing.ApprovedBy = model.ApprovedBy;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await LogAsync("Update", "Success", $"Updated leave {id}");

            return Ok(new { success = true });
        }

        // ================= DELETE =================
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var leave = await _context.DoctorLeaves.FindAsync(id);

            if (leave == null)
                return NotFound(new { message = "Not found" });

            _context.DoctorLeaves.Remove(leave);
            await _context.SaveChangesAsync();

            await LogAsync("Delete", "Success", $"Deleted leave {id}");

            return Ok(new { success = true });
        }
    }
}