using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicalSystem.Models
{
    /// <summary>
    /// 医生详细信息扩展表
    /// </summary>
    public class Doctor
    {
        [Key]
        public int Id { get; set; }

        // 1对1关联：外键指向 User 表的 Id (string类型)
        [Required]
        public string UserId { get; set; } = null!;
        
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        [Required(ErrorMessage = "执业证号是必填项")]
        [StringLength(50, ErrorMessage = "执业证号长度不能超过50个字符")]
        public string LicenseNumber { get; set; } = null!; 

        [Required(ErrorMessage = "专科/科室是必填项")]
        [StringLength(100)]
        public string Specialty { get; set; } = null!; 

        [Required(ErrorMessage = "职称是必填项")]
        [StringLength(50)]
        public string Title { get; set; } = null!; 

        [Required(ErrorMessage = "所属部门是必填项")]
        [StringLength(100)]
        public string Department { get; set; } = null!; 

        [Column(TypeName = "date")] // 强制数据库存储为日期格式(不含时间)
        public DateOnly DateOfBirth { get; set; }

        [StringLength(200)]
        public string? OfficeLocation { get; set; }

        [StringLength(500)]
        public string? Qualifications { get; set; }

        [Range(0, 70, ErrorMessage = "医龄必须在0到70之间")]
        public int YearsOfExperience { get; set; }

        [StringLength(2000)]
        public string? Biography { get; set; }
        
        public DateTime? UpdatedAt { get; set; }
    }
}