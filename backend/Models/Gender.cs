using System.ComponentModel.DataAnnotations;

namespace MedicalSystem.Models
{
    /// <summary>
    /// 性别定义表
    /// </summary>
    public class Gender
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "性别名称是必填项")]
        [StringLength(20)]
        public string Name { get; set; } = null!; // 例如："Male", "Female", "Other"

        public bool IsActive { get; set; } = true;
    }
}