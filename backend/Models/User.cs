using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicalSystem.Models
{
    public class User : IdentityUser<int>
    {
        [Required(ErrorMessage = "姓名不能为空")]
        [StringLength(100)]
        [Column("full_name")]
        public string FullName { get; set; } = null!;

        [Column("profile_image_url")]
        [StringLength(255)]
        public string? ProfileImageUrl { get; set; }

        [Column("gender_id")]
        public int? GenderId { get; set; }

        // 性别导航属性，让 Include(u => u.Gender) 可以加载性别字典资料。
        [ForeignKey(nameof(GenderId))]
        public virtual Gender? Gender { get; set; }

        [Column("date_of_birth")]
        public DateOnly? DateOfBirth { get; set; }

        // 重写基类的 PhoneNumber 以应用自定义列名和长度
        [Column("phone_number")]
        [StringLength(20)]
        public override string? PhoneNumber { get; set; }

        [Column("phone_number_alt")]
        [StringLength(20)]
        public string? PhoneNumberAlt { get; set; }

        [Column("address_line_1")]
        [StringLength(200)]
        public string? AddressLine1 { get; set; }

        [Column("address_line_2")]
        [StringLength(200)]
        public string? AddressLine2 { get; set; }

        [Column("city")]
        [StringLength(100)]
        public string? City { get; set; }

        [Column("state")]
        [StringLength(100)]
        public string? State { get; set; }

        [Column("postal_code")]
        [StringLength(20)]
        public string? PostalCode { get; set; }

        [Column("country")]
        [StringLength(100)]
        public string? Country { get; set; }

        [Column("role")]
        public UserRole Role { get; set; }

        [Column("status")]
        public int Status { get; set; } = 1;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // 双向导航属性
        public virtual Doctor? Doctor { get; set; }
        public virtual PatientProfile? PatientProfile { get; set; }
    }

    public enum UserRole
    {
        SuperAdmin = 0,
        Admin = 1,
        Doctor = 2,
        Patient = 3
    }
}
