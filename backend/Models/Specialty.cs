using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicalSystem.Models
{
    /// <summary>
    /// 医生专科表
    /// </summary>
    [Table("Specialties")]
    public class Specialty
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }

        [Required(ErrorMessage = "专科名称为必填项")]
        [StringLength(100, ErrorMessage = "专科名称长度不能超过 100 个字符")]
        public string name { get; set; } = null!;

        /// <summary>
        /// 状态：0 = 停用 (Inactive), 1 = 启用 (Active)
        /// </summary>
        [Required]
        [Range(0, 1, ErrorMessage = "状态值必须为 0 或 1")]
        public int status { get; set; }

        public DateTime created_at { get; set; } = DateTime.Now;

        public DateTime updated_at { get; set; } = DateTime.Now;
    }
}