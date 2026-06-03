using System.ComponentModel.DataAnnotations;

namespace MedicalSystem.Models
{
    public class Service
    {
        [Key]
        public int id { get; set; }

        [Required]
        public string name { get; set; } = string.Empty;

        [Required]
        public int status { get; set; } // 1 代表 Active, 0 代表 Inactive
    }
}