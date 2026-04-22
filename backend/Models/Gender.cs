using System.ComponentModel.DataAnnotations;

namespace MedicalSystem.Models
{
    public class Gender
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "性别名称是必填项")]
        [StringLength(20, ErrorMessage = "性别名称不能超过20个字符")]
        public string Name { get; set; } = null!; // "男", "女", "其他"

        public bool IsActive { get; set; } = true;
    }
}