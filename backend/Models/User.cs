using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicalSystem.Models
{
    /// <summary>
    /// 系统核心用户类，继承自 IdentityUser 处理登录认证
    /// </summary>
    public class User : IdentityUser
    {
        [Required(ErrorMessage = "真实姓名是必填项")]
        [PersonalData] // 标记为个人敏感数据，符合合规标准
        [StringLength(100, ErrorMessage = "姓名长度不能超过100个字符")]
        public string FullName { get; set; } = null!;

        [Required(ErrorMessage = "请选择性别")]
        public int GenderId { get; set; }
        
        [ForeignKey("GenderId")]
        public virtual Gender? Gender { get; set; }

        [Required]
        public UserRole Role { get; set; } // 0=SuperAdmin, 1=Admin, 2=Doctor, 3=Patient

        public bool IsActive { get; set; } = true; // 账号状态：true=正常, false=禁用

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // 导航属性：关联到医生详情（如果该用户是医生）
        public virtual Doctor? DoctorProfile { get; set; }
    }
}