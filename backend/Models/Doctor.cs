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
        public string? LicenseNumber { get; set; } // 改为可空，支持空值

        [Column("specialty_id")]
        public int? SpecialtyId { get; set; } // 改为可空，支持空值

        [Column("position_id")]
        public int? PositionId { get; set; } // 改为可空，支持空值

        [Column("department_id")]
        public int? DepartmentId { get; set; } // 改为可空，支持空值

        [Column("office_location_id")]
        public int? OfficeLocationId { get; set; }

        [Column("qualifications")]
        [StringLength(500)]
        public string? Qualifications { get; set; }

        [Column("biography")]
        [StringLength(2000)]
        public string? Biography { get; set; }

        [Column("years_of_experience")]
        public int? YearsOfExperience { get; set; } // 改为可空，支持空值

        [Column("date_join")]
        public DateOnly? DateJoin { get; set; } // 改为可空，支持空值

        [Column("date_left")]
        public DateOnly? DateLeft { get; set; }

        [Column("date_of_birth")]
        public DateOnly? DateOfBirth { get; set; } // 改为可空，支持空值

        [Column("remark")]
        [StringLength(1000)]
        public string? Remark { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}