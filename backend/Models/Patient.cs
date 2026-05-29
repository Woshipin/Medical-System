using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization; // 用于忽略序列化

namespace MedicalSystem.Models
{
    public class PatientProfile
    {
        [Key]
        public int Id { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        [JsonIgnore] // 仅使用系统自带的序列化忽略标记，无需依赖 Newtonsoft
        public User? User { get; set; }

        [Column("ic_number")]
        [StringLength(50)]
        public string? IcNumber { get; set; }

        [Column("blood_type")]
        [StringLength(10)]
        public string? BloodType { get; set; }

        [Column("allergies")]
        [StringLength(500)]
        public string? Allergies { get; set; }

        [Column("chronic_diseases")]
        [StringLength(500)]
        public string? ChronicDiseases { get; set; }

        [Column("medical_notes")]
        [StringLength(500)]
        public string? MedicalNotes { get; set; }

        [Column("emergency_contact_name")]
        [StringLength(100)]
        public string? EmergencyContactName { get; set; }

        [Column("emergency_contact_phone")]
        [StringLength(20)]
        public string? EmergencyContactPhone { get; set; }

        [Column("emergency_contact_relation")]
        [StringLength(50)]
        public string? EmergencyContactRelation { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}