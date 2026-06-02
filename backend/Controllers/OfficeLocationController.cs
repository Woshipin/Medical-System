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

        // 修复：返回 int? id 以匹配 LogExplicitAsync 签名
        private async Task<(int? id, string name, string role)> GetCurrentOperatorAsync()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!string.IsNullOrEmpty(userIdStr) && int.TryParse(userIdStr, out int userId))
            {
                var user = await _userManager.FindByIdAsync(userIdStr);
                if (user != null)
                {
                    return (user.Id, user.FullName ?? "Unknown", user.Role.ToString() ?? "Visitor");
                }
            }
            return (null, "System/Unknown", "Visitor");
        }

        private async Task LogBothAsync(string actionName, string status, string message)
        {
            var op = await GetCurrentOperatorAsync();
            _logger.LogInformation("[OfficeLocationController.{ActionName}] {Status}: {Message}", actionName, status, message);
            await _activityLog.LogExplicitAsync(op.id, op.name, op.role, actionName, $"[{status}] {message}");
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _context.OfficeLocations.OrderByDescending(o => o.id).ToListAsync();
            await LogBothAsync("Read", "Success", $"Retrieved {list.Count} office locations.");
            return Ok(ApiResponse<IEnumerable<OfficeLocation>>.SuccessResponse(list, "Office locations retrieved successfully."));
        }

        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveList()
        {
            var list = await _context.OfficeLocations.Where(o => o.status == 1).OrderBy(o => o.name).ToListAsync();
            await LogBothAsync("Read", "Success", $"Retrieved {list.Count} active office locations.");
            return Ok(ApiResponse<IEnumerable<OfficeLocation>>.SuccessResponse(list, "Active office locations retrieved successfully."));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var location = await _context.OfficeLocations.FindAsync(id);
            if (location == null)
            {
                await LogBothAsync("Read", "Failed", $"Office location not found for ID: {id}");
                return NotFound(ApiResponse<string>.FailureResponse("Office location not found."));
            }

            await LogBothAsync("Read", "Success", $"Retrieved office location ID: {id}");
            return Ok(ApiResponse<OfficeLocation>.SuccessResponse(location, "Office location retrieved successfully."));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] OfficeLocation model)
        {
            if (!ModelState.IsValid)
            {
                var validationErrors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                await LogBothAsync("Create", "Failed", "Data format error.");
                return BadRequest(ApiResponse<List<string>>.FailureResponse("Data format error.", validationErrors));
            }

            var exists = await _context.OfficeLocations.AnyAsync(o => o.name == model.name.Trim());
            if (exists)
            {
                await LogBothAsync("Create", "Failed", $"Name conflict: Office location '{model.name}' already exists.");
                return BadRequest(ApiResponse<string>.FailureResponse("Name conflict: Office location already exists."));
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

            await LogBothAsync(
                "Create", 
                "Success", 
                $"Created new office location:\n• ID -> {location.id}\n• Location Name -> {location.name}\n• Initial Status -> {(location.status == 1 ? "Active" : "Inactive")}"
            );

            return Ok(ApiResponse<OfficeLocation>.SuccessResponse(location, "Office location created successfully."));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] OfficeLocation model)
        {
            if (id != model.id)
            {
                await LogBothAsync("Update", "Failed", "ID mismatch in request.");
                return BadRequest(ApiResponse<string>.FailureResponse("Invalid request."));
            }

            if (!ModelState.IsValid)
            {
                var validationErrors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                await LogBothAsync("Update", "Failed", "Data validation failed.");
                return BadRequest(ApiResponse<List<string>>.FailureResponse("Data validation failed.", validationErrors));
            }

            var location = await _context.OfficeLocations.FindAsync(id);
            if (location == null)
            {
                await LogBothAsync("Update", "Failed", $"Office location not found for ID: {id}");
                return NotFound(ApiResponse<string>.FailureResponse("Office location not found."));
            }

            var exists = await _context.OfficeLocations.AnyAsync(o => o.name == model.name.Trim() && o.id != id);
            if (exists)
            {
                await LogBothAsync("Update", "Failed", $"Name conflict: The location name '{model.name}' is already taken.");
                return BadRequest(ApiResponse<string>.FailureResponse("Name conflict: Office location name is already taken."));
            }

            string oldName = location.name;
            int oldStatus = location.status;

            location.name = model.name.Trim();
            location.status = model.status;
            location.updated_at = DateTime.Now;

            await _context.SaveChangesAsync();

            await LogBothAsync(
                "Update", 
                "Success", 
                $"Updated office location (ID: {id}):\n• Location Name: {oldName} ➔ {location.name}\n• Status: {(oldStatus == 1 ? "Active" : "Inactive")} ➔ {(location.status == 1 ? "Active" : "Inactive")}"
            );

            return Ok(ApiResponse<OfficeLocation>.SuccessResponse(location, "Office location updated successfully."));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var location = await _context.OfficeLocations.FindAsync(id);
            if (location == null)
            {
                await LogBothAsync("Delete", "Failed", $"Office location not found for ID: {id}");
                return NotFound(ApiResponse<string>.FailureResponse("Office location not found."));
            }

            var hasDoctors = await _context.Doctors.AnyAsync(d => d.OfficeLocationId == id);
            if (hasDoctors)
            {
                await LogBothAsync("Delete", "Failed", $"Cannot delete location ID: {id}. It is currently assigned to doctors.");
                return BadRequest(ApiResponse<string>.FailureResponse("Cannot delete: Office location is currently assigned to doctors."));
            }

            _context.OfficeLocations.Remove(location);
            await _context.SaveChangesAsync();

            await LogBothAsync(
                "Delete", 
                "Success", 
                $"Deleted office location:\n• ID -> {location.id}\n• Location Name -> {location.name}"
            );

            return Ok(ApiResponse<string>.SuccessResponse(null, "Office location deleted successfully."));
        }
    }
}