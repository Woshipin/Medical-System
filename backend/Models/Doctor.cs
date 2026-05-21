using System.ComponentModel.DataAnnotations; // 引入数据注解命名空间，用于限制数据库字段和属性验证
using System.ComponentModel.DataAnnotations.Schema; // 引入数据库映射特性命名空间

namespace MedicalSystem.Models // 声明实体模型所在的命名空间
{
    /// <summary>
    /// 医生详细信息扩展表。与 User 表是一对一关系。
    /// </summary>
    public class Doctor // 定义 Doctor 扩展信息实体类
    {
        [Key] // 指定当前字段为主键
        public int Id { get; set; } // 医生表的唯一主键 ID

        // 【核心修改】：改为 int 类型，以匹配 User 表的新主键 ID
        [Required] // 设置为必填关联主键项
        public int UserId { get; set; } // 对应 User 主表的唯一标识 ID
        
        [ForeignKey("UserId")] // 指定 UserId 为外键以绑定 User 实体
        public virtual User? User { get; set; } // 声明指向 User 模型的虚拟导航属性

        [Required(ErrorMessage = "执业证号是必填项")] // 字段为必填项，并指定验证错误时的文字提示
        [StringLength(50)] // 指定执业证号的字符串最大长度限制为 50
        public string LicenseNumber { get; set; } = null!; // 医生的执业许可证号码属性

        [Required(ErrorMessage = "专科是必填项")] // 字段为必填项，并指定验证错误时的文字提示
        [StringLength(100)] // 指定专科方向的字符串最大长度限制为 100
        public string Specialty { get; set; } = null!; // 医生的专科特长领域属性

        [Required(ErrorMessage = "职称是必填项")] // 字段为必填项，并指定验证错误时的文字提示
        [StringLength(50)] // 指定职称的字符串最大长度限制为 50
        public string Title { get; set; } = null!; // 医生的职称属性（例如：主任医师，副主任医师）

        [Required(ErrorMessage = "所属部门是必填项")] // 字段为必填项，并指定验证错误时的文字提示
        [StringLength(100)] // 指定部门的字符串最大长度限制为 100
        public string Department { get; set; } = null!; // 医生所属的业务部门名称属性

        [Column(TypeName = "date")] // 指定映射到数据库时的底层数据类型为仅日期（Date）而无时间部分
        public DateOnly DateOfBirth { get; set; } // 医生的出生日期属性

        [StringLength(200)] // 限制诊室物理位置信息的最大长度为 200 个字符
        public string? OfficeLocation { get; set; } // 医生的办公坐诊地点属性，允许为空

        [StringLength(500)] // 限制资质证明说明的最大长度为 500 个字符
        public string? Qualifications { get; set; } // 医生的资质证书或教育背景描述信息属性，允许为空

        [Range(0, 70)] // 约束医生的从业年限范围在数值 0 到 70 之间
        public int YearsOfExperience { get; set; } // 医生的从业工龄或年限属性

        [StringLength(2000)] // 限制个人简历内容的最大长度为 2000 个字符
        public string? Biography { get; set; } // 医生个人简历与主页简介描述属性，允许为空
        
        public DateTime? UpdatedAt { get; set; } // 记录医生专属信息的修改和更新时间，允许为空
    }
}