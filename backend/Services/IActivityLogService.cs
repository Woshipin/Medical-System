using System.Threading.Tasks; // 【修复新增】引入异步任务命名空间，用于支持 Task 异步方法

namespace MedicalSystem.Services // 声明命名空间
{
    /// <summary>
    /// 操作日志记录服务接口
    /// </summary>
    public interface IActivityLogService // 定义接口
    {
        // 自动解析当前登录用户的日志写入方法，支持动作与详细描述分离
        Task LogAsync(string action, string description);

        // 手动传入指定用户参数的日志写入方法，支持动作与详细描述分离
        Task LogExplicitAsync(int? userId, string fullName, string role, string action, string description);
    }
}