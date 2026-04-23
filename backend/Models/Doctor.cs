using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicalSystem.Models
{
    /// <summary>
    /// 医生详细信息扩展表。与 User 表是一对一关系。
    /// </summary>
    public class Doctor
    {
        [Key]
        public int Id { get; set; }

        // 【核心修改】：改为 int 类型，以匹配 User 表的新主键 ID
        [Required]
        public int UserId { get; set; }
        
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        [Required(ErrorMessage = "执业证号是必填项")]
        [StringLength(50)]
        public string LicenseNumber { get; set; } = null!; 

        [Required(ErrorMessage = "专科是必填项")]
        [StringLength(100)]
        public string Specialty { get; set; } = null!; 

        [Required(ErrorMessage = "职称是必填项")]
        [StringLength(50)]
        public string Title { get; set; } = null!; 

        [Required(ErrorMessage = "所属部门是必填项")]
        [StringLength(100)]
        public string Department { get; set; } = null!; 

        [Column(TypeName = "date")] 
        public DateOnly DateOfBirth { get; set; }

        [StringLength(200)]
        public string? OfficeLocation { get; set; }

        [StringLength(500)]
        public string? Qualifications { get; set; } // 资质证书

        [Range(0, 70)]
        public int YearsOfExperience { get; set; }

        [StringLength(2000)]
        public string? Biography { get; set; } // 个人简介
        
        public DateTime? UpdatedAt { get; set; }
    }
}