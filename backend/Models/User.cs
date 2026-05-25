using Microsoft.AspNetCore.Identity; // 引入 ASP.NET Core Identity 成员身份管理框架
using System;
using System.ComponentModel.DataAnnotations; // 引入数据注解命名空间

namespace MedicalSystem.Models // 声明实体模型所在的命名空间
{
    /// <summary>
    /// 用户角色定义
    /// </summary>
    public enum UserRole { SuperAdmin = 0, Admin = 1, Doctor = 2, Patient = 3 } // 定义用户角色枚举

    /// <summary>
    /// 系统核心用户类。主键 ID 为自增数字。
    /// </summary>
    public class User : IdentityUser<int> // 继承 IdentityUser 并指定主键类型为 int 整型
    {
        // 注意：基类自带的 Id, Email, PhoneNumber, PasswordHash 属性无需在此重写，
        // 我们已在 AppDbContext 中通过 Fluent API 统一配置了它们的小写映射和严格物理显示顺序。

        [Required(ErrorMessage = "真实姓名是必填项")] 
        [StringLength(100)] 
        public string full_name { get; set; } = null!; // 真实姓名

        public int? gender_id { get; set; } // 性别关联 ID
        
        public virtual Gender? gender { get; set; } // 导航属性

        public bool? status { get; set; } = true; // 账号状态

        public UserRole? role { get; set; } // 业务角色

        public DateTime? created_at { get; set; } = DateTime.Now; // 创建时间

        public DateTime? updated_at { get; set; } = DateTime.Now; // 更新时间
    }
}