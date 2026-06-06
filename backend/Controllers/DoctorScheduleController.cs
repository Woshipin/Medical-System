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
    public class DoctorScheduleController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IActivityLogService _activityLog;
        private readonly ILogger<DoctorScheduleController> _logger;

        public DoctorScheduleController(
            AppDbContext context,
            IActivityLogService activityLog,
            ILogger<DoctorScheduleController> logger)
        {
            _context = context;
            _activityLog = activityLog;
            _logger = logger;
        }

        private async Task LogAsync(string action, string status, string message)
        {
            _logger.LogInformation("[DoctorSchedule.{Action}] {Status}: {Message}", action, status, message);
            await _activityLog.LogAsync(action, $"[{status}] {message}");
        }

        // ================= DTO =================
        public class DoctorScheduleDto
        {
            public int DoctorId { get; set; }
            public int DayOfWeek { get; set; }
            public TimeOnly StartTime { get; set; }
            public TimeOnly EndTime { get; set; }
            public int SlotDuration { get; set; } = 30;
            public bool IsActive { get; set; } = true;
        }

        // ================= GET =================
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var schedules = await _context.DoctorSchedules.ToListAsync();
            var doctors = await _context.Doctors.Include(d => d.User).ToListAsync();

            var resultList = new List<object>();

            foreach (var sch in schedules)
            {
                // 双向兼容匹配：优先匹配 Doctor.Id，如果没有匹配到，则匹配 Doctor.UserId
                var doc = doctors.FirstOrDefault(d => d.Id == sch.DoctorId) 
                          ?? doctors.FirstOrDefault(d => d.UserId == sch.DoctorId);

                resultList.Add(new
                {
                    id = sch.Id,
                    doctorId = sch.DoctorId,
                    dayOfWeek = (int)sch.DayOfWeek,
                    startTime = sch.StartTime.ToString("HH:mm"), // 已截取为完美的 HH:mm 格式，消除小数位
                    endTime = sch.EndTime.ToString("HH:mm"),     // 已修正：去除了多余的 "x => "
                    slotDuration = sch.SlotDuration,
                    isActive = sch.IsActive,
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

            await LogAsync("Read", "Success", $"Fetched {schedules.Count}");
            return Ok(resultList);
        }

        // ================= CREATE =================
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] DoctorScheduleDto model)
        {
            if (model.StartTime >= model.EndTime)
            {
                return BadRequest(new { message = "Invalid time range" });
            }

            var exists = await _context.DoctorSchedules.AnyAsync(x =>
                x.DoctorId == model.DoctorId &&
                x.DayOfWeek == (DayOfWeek)model.DayOfWeek &&
                x.IsActive
            );

            if (exists)
            {
                return BadRequest(new { message = "Schedule already exists" });
            }

            var schedule = new DoctorSchedule
            {
                DoctorId = model.DoctorId,
                DayOfWeek = (DayOfWeek)model.DayOfWeek,
                StartTime = model.StartTime,
                EndTime = model.EndTime,
                SlotDuration = model.SlotDuration,
                IsActive = model.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.DoctorSchedules.Add(schedule);
            await _context.SaveChangesAsync();

            await LogAsync("Create", "Success", $"Doctor {model.DoctorId} schedule created");

            return Ok(new { success = true, data = schedule });
        }

        // ================= UPDATE =================
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DoctorScheduleDto model)
        {
            var existing = await _context.DoctorSchedules.FindAsync(id);

            if (existing == null)
                return NotFound(new { message = "Not found" });

            existing.DoctorId = model.DoctorId;
            existing.DayOfWeek = (DayOfWeek)model.DayOfWeek;
            existing.StartTime = model.StartTime;
            existing.EndTime = model.EndTime;
            existing.SlotDuration = model.SlotDuration;
            existing.IsActive = model.IsActive;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await LogAsync("Update", "Success", $"Updated schedule {id}");

            return Ok(new { success = true });
        }

        // ================= DELETE =================
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var schedule = await _context.DoctorSchedules.FindAsync(id);

            if (schedule == null)
                return NotFound(new { message = "Not found" });

            _context.DoctorSchedules.Remove(schedule);
            await _context.SaveChangesAsync();

            await LogAsync("Delete", "Success", $"Deleted schedule {id}");

            return Ok(new { success = true });
        }
    }
}