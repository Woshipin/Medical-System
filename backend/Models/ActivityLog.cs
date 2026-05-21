using System; // 引入系统基础命名空间，提供 DateTime 类型支持

namespace MedicalSystem.Models // 声明实体模型所在的命名空间
{
    /// <summary>
    /// 系统操作日志表
    /// </summary>
    public class ActivityLog // 定义 ActivityLog 实体类
    {
        public int Id { get; set; } // 日志自增主键 ID，EF Core 会自动将其设为自增主键，无需额外特性

        public int? UserId { get; set; } // 操作用户 ID（允许为空）

        public string FullName { get; set; } = null!; // 操作人姓名，不带任何 Validation 校验

        public string Role { get; set; } = null!; // 操作人系统角色，不带任何 Validation 校验

        public string Action { get; set; } = null!; // 简短操作动作（如 Created, Updated, Deleted），不带任何 Validation 校验

        public string Description { get; set; } = null!; // 详细操作描述，不带任何 Validation 校验

        public DateTime CreatedAt { get; set; } = DateTime.Now; // 日志记录生成时间，不带任何 Validation 校验
    }
}