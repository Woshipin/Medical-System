using Microsoft.AspNetCore.Mvc; // 引入 MVC 核心框架
using Microsoft.EntityFrameworkCore; // 引入 EF 核心扩展方法
using MedicalSystem.Data; // 引入数据上下文命名空间
using MedicalSystem.Models; // 引入实体模型命名空间
using Microsoft.AspNetCore.Authorization; // 引入安全授权命名空间

namespace MedicalSystem.Controllers // 声明控制器类所在的命名空间
{
    [ApiController] // 标志为 Api 控制器
    [Route("api/[controller]")] // 设定访问路由为 api/ActivityLogs
    [Authorize(Roles = "SuperAdmin, Admin")] // 【安全控制】：该控制器只允许具有管理员和超级管理员角色的人访问
    public class ActivityLogsController : ControllerBase // 继承 ControllerBase
    {
        private readonly AppDbContext _context; // 声明只读数据库上下文

        public ActivityLogsController(AppDbContext context) // 构造函数，利用注入载入上下文
        {
            _context = context; // 初始化
        }

        // 获取系统所有的操作日志列表
        [HttpGet] // 映射 HTTP GET 查询请求
        public async Task<IActionResult> GetLogs() // 异步获取操作日志的方法
        {
            var logs = await _context.ActivityLogs // 查询操作日志数据集
                .OrderByDescending(l => l.CreatedAt) // 依照日志创建时间进行降序排序（最新发生的操作排在最上面）
                .ToListAsync(); // 异步转换为 List 集合

            return Ok(ApiResponse<IEnumerable<ActivityLog>>.SuccessResponse(logs)); // 包装为成功格式响应给前端
        }
    }
}