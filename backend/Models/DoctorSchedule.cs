using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicalSystem.Models
{
    public class DoctorSchedule
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [Column("doctor_id")]
        public int DoctorId { get; set; }

        [ForeignKey(nameof(DoctorId))]
        public virtual Doctor? Doctor { get; set; }

        [Required]
        [Column("day_of_week")]
        public DayOfWeek DayOfWeek { get; set; }

        [Required]
        [Column("start_time")]
        public TimeOnly StartTime { get; set; }

        [Required]
        [Column("end_time")]
        public TimeOnly EndTime { get; set; }

        [Column("slot_duration")]
        public int SlotDuration { get; set; } = 30;

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}