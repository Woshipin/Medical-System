using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicalSystem.Models
{
    public class Doctor
    {
        [Key]
        public int Id { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        [ForeignKey(nameof(UserId))] // 修复此处，指向 C# 属性名
        public User? User { get; set; }

        [Required]
        [StringLength(50)]
        [Column("license_number")]
        public string LicenseNumber { get; set; } = null!;

        // 专科外键，对应数据库 specialty_id。
        [Column("specialty_id")]
        public int SpecialtyId { get; set; }

        // 职称外键，对应数据库 title_id。
        [Column("title_id")]
        public int TitleId { get; set; }

        // 科室外键，对应数据库 department_id。
        [Column("department_id")]
        public int DepartmentId { get; set; }

        // 医生出生日期，用于后台医生资料管理。
        [Column("date_of_birth")]
        public DateOnly DateOfBirth { get; set; }

        // 诊室位置外键，可为空表示暂未分配诊室。
        [Column("office_location_id")]
        public int? OfficeLocationId { get; set; }

        [Column("qualifications")]
        [StringLength(500)]
        public string? Qualifications { get; set; }

        [Column("biography")]
        [StringLength(2000)]
        public string? Biography { get; set; }

        [Column("signature_image_url")]
        [StringLength(255)]
        public string? SignatureImageUrl { get; set; }

        // 简历 PDF 二进制内容，对应迁移中的 longblob 字段。
        [Column("resume_pdf")]
        public byte[]? ResumePdf { get; set; }

        // 医生详细地址。
        [Column("address")]
        [StringLength(500)]
        public string? Address { get; set; }

        // 邮政编码。
        [Column("postal_code")]
        [StringLength(20)]
        public string? PostalCode { get; set; }

        // 诊室联系电话。
        [Column("office_phone")]
        [StringLength(50)]
        public string? OfficePhone { get; set; }

        // 从业年限。
        [Column("years_of_experience")]
        public int YearsOfExperience { get; set; }

        [Column("date_join")]
        public DateOnly DateJoin { get; set; }

        [Column("date_left")]
        public DateOnly? DateLeft { get; set; }

        [Column("status")]
        public int Status { get; set; } = 1;

        // 医生资料备注。
        [Column("remark")]
        [StringLength(1000)]
        public string? Remark { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
