using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicalSystem.Models
{
    public class DoctorLeave
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [Column("doctor_id")]
        public int DoctorId { get; set; }

        [ForeignKey(nameof(DoctorId))]
        public virtual Doctor? Doctor { get; set; }

        [Required]
        [Column("leave_type")]
        public LeaveType LeaveType { get; set; }

        [Required]
        [Column("start_date")]
        public DateOnly StartDate { get; set; }

        [Required]
        [Column("end_date")]
        public DateOnly EndDate { get; set; }

        [Column("start_time")]
        public TimeOnly? StartTime { get; set; }

        [Column("end_time")]
        public TimeOnly? EndTime { get; set; }

        [Column("is_full_day")]
        public bool IsFullDay { get; set; } = true;

        [Column("status")]
        public LeaveStatus Status { get; set; } = LeaveStatus.Pending;

        [StringLength(1000)]
        [Column("reason")]
        public string? Reason { get; set; }

        [Column("approved_by")]
        public int? ApprovedBy { get; set; }

        [ForeignKey(nameof(ApprovedBy))]
        public virtual User? Approver { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public enum LeaveType
    {
        Annual = 0,
        Medical = 1,
        Emergency = 2,
        Personal = 3,
        Training = 4,
        Other = 5
    }

    public enum LeaveStatus
    {
        Pending = 0,
        Approved = 1,
        Rejected = 2
    }
}