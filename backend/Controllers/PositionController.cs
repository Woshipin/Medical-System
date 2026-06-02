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
            _logger.LogInformation("[PositionController.{ActionName}] {Status}: {Message}", actionName, status, message);
            await _activityLog.LogExplicitAsync(op.id, op.name, op.role, actionName, $"[{status}] {message}");
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _context.Positions.OrderByDescending(p => p.id).ToListAsync();
            await LogBothAsync("Read", "Success", $"Retrieved {list.Count} positions.");
            return Ok(ApiResponse<IEnumerable<Position>>.SuccessResponse(list, "Positions retrieved successfully."));
        }

        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveList()
        {
            var list = await _context.Positions.Where(p => p.status == 1).OrderBy(p => p.id).ToListAsync();
            await LogBothAsync("Read", "Success", $"Retrieved {list.Count} active positions.");
            return Ok(ApiResponse<IEnumerable<Position>>.SuccessResponse(list, "Active positions retrieved successfully."));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var position = await _context.Positions.FindAsync(id);
            if (position == null)
            {
                await LogBothAsync("Read", "Failed", $"Position not found for ID: {id}");
                return NotFound(ApiResponse<string>.FailureResponse("Position not found."));
            }

            await LogBothAsync("Read", "Success", $"Retrieved position ID: {id}");
            return Ok(ApiResponse<Position>.SuccessResponse(position, "Position retrieved successfully."));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Position model)
        {
            if (!ModelState.IsValid)
            {
                var validationErrors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                await LogBothAsync("Create", "Failed", "Data format error.");
                return BadRequest(ApiResponse<List<string>>.FailureResponse("Data format error.", validationErrors));
            }

            var exists = await _context.Positions.AnyAsync(p => p.name == model.name.Trim());
            if (exists)
            {
                await LogBothAsync("Create", "Failed", $"Name conflict: Position '{model.name}' already exists.");
                return BadRequest(ApiResponse<string>.FailureResponse("Position name already exists."));
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

            await LogBothAsync(
                "Create", 
                "Success", 
                $"Created new position:\n• ID -> {position.id}\n• Position Name -> {position.name}\n• Initial Status -> {(position.status == 1 ? "Active" : "Inactive")}"
            );

            return Ok(ApiResponse<Position>.SuccessResponse(position, "Position created successfully."));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Position model)
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

            var position = await _context.Positions.FindAsync(id);
            if (position == null)
            {
                await LogBothAsync("Update", "Failed", $"Position not found for ID: {id}");
                return NotFound(ApiResponse<string>.FailureResponse("Position not found."));
            }

            var exists = await _context.Positions.AnyAsync(p => p.name == model.name.Trim() && p.id != id);
            if (exists)
            {
                await LogBothAsync("Update", "Failed", $"Name conflict: The position name '{model.name}' is already taken.");
                return BadRequest(ApiResponse<string>.FailureResponse("Position name is already taken."));
            }

            string oldName = position.name;
            int oldStatus = position.status;

            position.name = model.name.Trim();
            position.status = model.status;
            position.updated_at = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await LogBothAsync(
                "Update", 
                "Success", 
                $"Updated position (ID: {id}):\n• Position Name: {oldName} ➔ {position.name}\n• Status: {(oldStatus == 1 ? "Active" : "Inactive")} ➔ {(position.status == 1 ? "Active" : "Inactive")}"
            );

            return Ok(ApiResponse<Position>.SuccessResponse(position, "Position updated successfully."));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var position = await _context.Positions.FindAsync(id);
            if (position == null)
            {
                await LogBothAsync("Delete", "Failed", $"Position not found for ID: {id}");
                return NotFound(ApiResponse<string>.FailureResponse("Position not found."));
            }

            var hasDoctors = await _context.Doctors.AnyAsync(d => d.PositionId == id);
            if (hasDoctors)
            {
                await LogBothAsync("Delete", "Failed", $"Cannot delete position ID: {id}. It is currently assigned to doctors.");
                return BadRequest(ApiResponse<string>.FailureResponse("Cannot delete: Position is currently assigned to doctors."));
            }

            _context.Positions.Remove(position);
            await _context.SaveChangesAsync();

            await LogBothAsync(
                "Delete", 
                "Success", 
                $"Deleted position:\n• ID -> {position.id}\n• Position Name -> {position.name}"
            );

            return Ok(ApiResponse<string>.SuccessResponse(null, "Position deleted successfully."));
        }
    }
}