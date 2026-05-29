using System;
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

        [ForeignKey(nameof(UserId))]
        public virtual User? User { get; set; }

        [Column("office_phone")]
        [StringLength(50)]
        public string? OfficePhone { get; set; }

        [Column("license_number")]
        [StringLength(50)]
        public string? LicenseNumber { get; set; } 

        [Column("specialty_id")]
        public int? SpecialtyId { get; set; } 

        [Column("position_id")]
        public int? PositionId { get; set; } 

        [Column("department_id")]
        public int? DepartmentId { get; set; } 

        [Column("office_location_id")]
        public int? OfficeLocationId { get; set; }

        [Column("qualifications")]
        [StringLength(500)]
        public string? Qualifications { get; set; }

        [Column("biography")]
        [StringLength(2000)]
        public string? Biography { get; set; }

        [Column("years_of_experience")]
        public int? YearsOfExperience { get; set; } 

        [Column("date_join")]
        public DateOnly? DateJoin { get; set; } 

        [Column("date_left")]
        public DateOnly? DateLeft { get; set; }

        // 将数据库列名显式定义为 "work_status"
        [Column("work_status")]
        public int? Status { get; set; } // 医生工作状态 (Work Status): 0 - Active / Working, 1 - Suspended, 2 - On Leave, 3 - Terminated

        [Column("remark")]
        [StringLength(1000)]
        public string? Remark { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}