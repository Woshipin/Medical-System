using System;
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
        public int id { get; set; } // 医生表的唯一主键 ID

        [Required] // 设置为必填关联主键项
        public int user_id { get; set; } // 对应 User 主表的唯一标识 ID
        
        [ForeignKey("user_id")] // 指定 user_id 为外键以绑定 User 实体
        public virtual User? user { get; set; } // 声明指向 User 模型的虚拟导航属性

        [Required(ErrorMessage = "执业证号是必填项")] // 字段为必填项，并指定验证错误时的文字提示
        [StringLength(50)] // 指定执业证号的字符串最大长度限制为 50
        public string license_number { get; set; } = null!; // 医生的执业许可证号码属性

        [Required(ErrorMessage = "专科是必填项")] 
        public int specialty_id { get; set; } // 专科关联 ID

        [Required(ErrorMessage = "职称是必填项")] 
        public int title_id { get; set; } // 职称关联 ID

        [Required(ErrorMessage = "所属部门是必填项")] 
        public int department_id { get; set; } // 所属部门关联 ID

        [Column(TypeName = "date")] // 指定映射到数据库时的底层数据类型为仅日期（Date）而无时间部分
        public DateOnly date_of_birth { get; set; } // 医生的出生日期属性

        public int? office_location_id { get; set; } // 诊室位置关联 ID，允许为空

        [StringLength(500)] // 限制资质证明说明的最大长度为 500 个字符
        public string? qualifications { get; set; } // 医生的资质证书或教育背景描述信息属性，允许为空

        [Range(0, 70)] // 约束医生的从业年限范围在数值 0 到 70 之间
        public int years_of_experience { get; set; } // 医生的从业工龄或年限属性

        [StringLength(2000)] // 限制个人简历内容的最大长度为 2000 个字符
        public string? biography { get; set; } // 医生个人简历与主页简介描述属性，允许为空
        
        public DateTime? updated_at { get; set; } // 记录医生专属信息的修改和更新时间，允许为空

        // ==================== 新增字段 ====================

        /// <summary>
        /// 用于存储 PDF 简历的二进制数据
        /// </summary>
        public byte[]? resume_pdf { get; set; }

        /// <summary>
        /// 医生住址
        /// </summary>
        [StringLength(500)]
        public string? address { get; set; }

        /// <summary>
        /// 邮政编码
        /// </summary>
        [StringLength(20)]
        public string? postal_code { get; set; }

        /// <summary>
        /// 医生诊室电话号码
        /// </summary>
        [StringLength(50)]
        public string? office_phone { get; set; }

        /// <summary>
        /// 入职日期
        /// </summary>
        [Column(TypeName = "date")]
        public DateOnly date_join { get; set; }

        /// <summary>
        /// 离职日期，允许为空
        /// </summary>
        [Column(TypeName = "date")]
        public DateOnly? date_left { get; set; }

        /// <summary>
        /// 医生工作状态（0: 任职, 1: 停职, 2: 休息, 3: 开除）
        /// </summary>
        [Required]
        [Range(0, 4, ErrorMessage = "状态值必须在 0 到 4 之间")]
        public int status { get; set; }

        /// <summary>
        /// 备注信息，允许为空
        /// </summary>
        [StringLength(1000)]
        public string? remark { get; set; }
    }
}