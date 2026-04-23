using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicalSystem.Models
{
    /// <summary>
    /// 用户角色定义
    /// </summary>
    public enum UserRole { SuperAdmin = 0, Admin = 1, Doctor = 2, Patient = 3 }

    /// <summary>
    /// 系统核心用户类。主键 ID 为自增数字。
    /// </summary>
    public class User : IdentityUser<int> 
    {
        // 1. 映射为 Full_Name
        [Required(ErrorMessage = "真实姓名是必填项")]
        [StringLength(100)]
        [Column("Full_Name")] 
        public string FullName { get; set; } = null!;

        // 2. Email (Identity 默认字段，将在 DbContext 中映射)

        // 3. 映射为 Phone_Number
        [Column("Phone_Number")]
        public override string? PhoneNumber { get; set; }

        // 4. 映射为 Gender (存储性别ID)
        [Required]
        [Column("Gender")]
        public int GenderId { get; set; }
        
        [ForeignKey("GenderId")]
        public virtual Gender? Gender { get; set; }

        // 5. 映射为 Role
        [Required]
        [Column("Role")]
        public UserRole Role { get; set; } 

        // 6. 映射为 Status (表示账号激活状态)
        [Column("Status")]
        public bool IsActive { get; set; } = true; 

        // 7. 映射为 Created_at
        [Required]
        [Column("Created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // 8. 映射为 Updated_at
        [Required]
        [Column("Updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        public virtual Doctor? DoctorProfile { get; set; }
    }
}