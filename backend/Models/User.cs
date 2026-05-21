using Microsoft.AspNetCore.Identity; // 引入 ASP.NET Core Identity 成员身份管理框架
using System.ComponentModel.DataAnnotations; // 引入数据注解命名空间，用于模型数据验证
using System.ComponentModel.DataAnnotations.Schema; // 引入数据库架构映射命名空间

namespace MedicalSystem.Models // 声明实体模型所在的命名空间
{
    /// <summary>
    /// 用户角色定义
    /// </summary>
    public enum UserRole { SuperAdmin = 0, Admin = 1, Doctor = 2, Patient = 3 } // 定义用户角色枚举：超级管理员、管理员、医生、患者

    /// <summary>
    /// 系统核心用户类。主键 ID 为自增数字。
    /// </summary>
    public class User : IdentityUser<int> // 继承 IdentityUser 并指定主键类型为 int 整型
    {
        // 1. 映射为 Full_Name
        [Required(ErrorMessage = "真实姓名是必填项")] // 设置为必填项并定义验证失败时的错误提示消息
        [StringLength(100)] // 限制属性值的最大长度为 100 个字符
        [Column("Full_Name")] // 指定该属性映射到数据库中的列名为 Full_Name
        public string FullName { get; set; } = null!; // 用户真实姓名属性，默认初始化为非空

        // 2. Email (Identity 默认字段，将在 DbContext 中映射)

        // 3. 映射为 Phone_Number
        [Column("Phone_Number")] // 指定该属性映射到数据库中的列名为 Phone_Number
        public override string? PhoneNumber { get; set; } // 重写父类的电话号码属性，并声明为允许为空的字符串

        // 4. 映射为 Gender (存储性别ID)
        [Required] // 设置为必须提供的值
        [Column("Gender")] // 指定该属性映射到数据库中的列名为 Gender
        public int GenderId { get; set; } // 用户关联的性别 ID 属性
        
        [ForeignKey("GenderId")] // 显式指明 GenderId 属性为关联到 Gender 实体的外键
        public virtual Gender? Gender { get; set; } // 声明指向 Gender 关联实体的导航属性，支持延迟加载

        // 5. 映射为 Role
        [Required] // 设置为必须提供的值
        [Column("Role")] // 指定该属性映射到数据库中的列名为 Role
        public UserRole Role { get; set; } // 用户的业务角色枚举属性

        // 6. 映射为 Status (表示账号激活状态)
        [Column("Status")] // 指定该属性映射到数据库中的列名为 Status
        public bool IsActive { get; set; } = true; // 用户的激活状态属性，默认值为启用（true）

        // 7. 映射为 Created_at
        [Required] // 设置为必填项
        [Column("Created_at")] // 指定该属性映射到数据库中的列名为 Created_at
        public DateTime CreatedAt { get; set; } = DateTime.Now; // 用户记录创建时间属性，默认初始化为当前系统时间

        // 8. 映射为 Updated_at
        [Required] // 设置为必填项
        [Column("Updated_at")] // 指定该属性映射到数据库中的列名为 Updated_at
        public DateTime UpdatedAt { get; set; } = DateTime.Now; // 用户记录最后更新时间属性，默认初始化为当前系统时间

        public virtual Doctor? DoctorProfile { get; set; } // 声明指向 Doctor 医生的 1对1 扩展信息关联的导航属性
    }
}