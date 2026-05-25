using System; // 引入基础命名空间
using System.Threading.Tasks; // 引入异步命名空间
using Microsoft.AspNetCore.Http; // 引入 HTTP 命名空间
using MedicalSystem.Data; // 引入数据上下文
using MedicalSystem.Models; // 引入实体模型
using System.Security.Claims; // 引入 Claims 读取
using System.IdentityModel.Tokens.Jwt; // 引入 JWT 读取

namespace MedicalSystem.Services // 声明服务实现所在的命名空间
{
    public class ActivityLogService : IActivityLogService // 实现日志接口
    {
        private readonly AppDbContext _context; // 声明只读数据库上下文
        private readonly IHttpContextAccessor _httpContextAccessor; // 声明 HTTP 上下文访问器

        public ActivityLogService(AppDbContext context, IHttpContextAccessor httpContextAccessor) // 构造注入
        {
            _context = context; // 绑定
            _httpContextAccessor = httpContextAccessor; // 绑定
        }

        // 自动提取用户上下文并记录日志
        public async Task LogAsync(string action, string description) 
        {
            var httpContext = _httpContextAccessor.HttpContext; // 获取当前请求上下文
            if (httpContext == null) return; // 为空返回

            var user = httpContext.User; // 获取主体
            int? userId = null; // 初始化 ID 
            string fullName = "Anonymous"; // 初始化姓名
            string role = "Visitor"; // 初始化角色

            if (user.Identity?.IsAuthenticated == true) // 若通过 Token 身份验证
            {
                var idClaim = user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value 
                           ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value; // 提取 ID Claim

                if (int.TryParse(idClaim, out var parsedId)) // 尝试强转整型
                {
                    userId = parsedId; // 赋值
                    var dbUser = await _context.Users.FindAsync(parsedId); // 查库获取最新的姓名与角色
                    if (dbUser != null)
                    {
                        fullName = dbUser.full_name; // 【修复】：改用小写 full_name
                        role = dbUser.role?.ToString() ?? "Visitor"; // 【修复】：改用小写 role，并处理 null 情况
                    }
                }
            }

            var log = new ActivityLog // 创建精简后的实体模型
            {
                // 【修复】：将所有属性名改为模型定义的小写蛇形
                user_id = userId,
                full_name = fullName,
                role = role,
                action = action, 
                description = description, 
                created_at = DateTime.Now
            };

            _context.ActivityLogs.Add(log); // 追踪
            await _context.SaveChangesAsync(); // 入库
        }

        // 手动传入指定参数记录日志
        // 【修复】：接收可空的 string? role
        public async Task LogExplicitAsync(int? userId, string fullName, string? role, string action, string description)
        {
            var log = new ActivityLog 
            {
                // 【修复】：将所有属性名改为模型定义的小写蛇形
                user_id = userId,
                full_name = fullName,
                role = role ?? "Visitor", // 如果角色传进来是 null，默认存 Visitor
                action = action, 
                description = description, 
                created_at = DateTime.Now
            };

            _context.ActivityLogs.Add(log); // 追踪
            await _context.SaveChangesAsync(); // 写入物理数据库
        }
    }
}