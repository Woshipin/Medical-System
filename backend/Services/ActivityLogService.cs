using System; 
using System.Threading.Tasks; 
using Microsoft.AspNetCore.Http; 
using MedicalSystem.Data; 
using MedicalSystem.Models; 
using System.Security.Claims; 
using System.IdentityModel.Tokens.Jwt; 

namespace MedicalSystem.Services 
{
    public class ActivityLogService : IActivityLogService 
    {
        private readonly AppDbContext _context; 
        private readonly IHttpContextAccessor _httpContextAccessor; 

        public ActivityLogService(AppDbContext context, IHttpContextAccessor httpContextAccessor) 
        {
            _context = context; 
            _httpContextAccessor = httpContextAccessor; 
        }

        public async Task LogAsync(string action, string description) 
        {
            var httpContext = _httpContextAccessor.HttpContext; 
            if (httpContext == null) return; 

            var user = httpContext.User; 
            int? userId = null; 
            string fullName = "Anonymous"; 
            string role = "Visitor"; 

            if (user.Identity?.IsAuthenticated == true) 
            {
                var idClaim = user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value 
                           ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value; 

                if (int.TryParse(idClaim, out var parsedId)) 
                {
                    userId = parsedId; 
                    var dbUser = await _context.Users.FindAsync(parsedId); 
                    if (dbUser != null)
                    {
                        fullName = dbUser.FullName; 
                        role = dbUser.Role.ToString() ?? "Visitor"; 
                    }
                }
            }

            var log = new ActivityLog 
            {
                user_id = userId,
                full_name = fullName,
                role = role,
                action = action, 
                description = description, 
                created_at = DateTime.Now // 纭繚鑾峰彇褰撳墠绮惧噯鏃堕棿骞跺叆搴?
            };

            _context.ActivityLogs.Add(log); 
            await _context.SaveChangesAsync(); 
        }

        public async Task LogExplicitAsync(int? userId, string fullName, string? role, string action, string description)
        {
            var log = new ActivityLog 
            {
                user_id = userId,
                full_name = fullName,
                role = role ?? "Visitor", 
                action = action, 
                description = description, 
                created_at = DateTime.Now // 纭繚鑾峰彇褰撳墠绮惧噯鏃堕棿骞跺叆搴?
            };

            _context.ActivityLogs.Add(log); 
            await _context.SaveChangesAsync(); 
        }
    }
}

