using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedicalSystem.Models
{
    /// <summary>
    /// 诊室位置表
    /// </summary>
    [Table("OfficeLocations")]
    public class OfficeLocation
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }

        [Required(ErrorMessage = "诊室/位置名称为必填项")]
        [StringLength(150, ErrorMessage = "诊室名称长度不能超过 150 个字符")]
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