using System; // 引入系统基础命名空间，提供 DateTime 类型支持

namespace MedicalSystem.Models // 声明实体模型所在的命名空间
{
    /// <summary>
    /// 系统操作日志表
    /// </summary>
    public class ActivityLog // 定义 ActivityLog 实体类
    {
        public int id { get; set; } // 日志自增主键 ID

        public int? user_id { get; set; } // 操作用户 ID（允许为空）

        public string full_name { get; set; } = null!; // 操作人姓名

        public string role { get; set; } = null!; // 操作人系统角色

        public string action { get; set; } = null!; // 简短操作动作（如 Created, Updated, Deleted）

        public string description { get; set; } = null!; // 详细操作描述

        public DateTime created_at { get; set; } = DateTime.Now; // 日志记录生成时间
    }
}