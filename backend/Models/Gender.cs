using System.ComponentModel.DataAnnotations; // 引入数据注解命名空间，用于配置属性验证和数据库映射

namespace MedicalSystem.Models // 声明实体模型所在的命名空间
{
    /// <summary>
    /// 性别定义表
    /// </summary>
    public class Gender // 定义 Gender 实体类
    {
        [Key] // 标识当前属性为数据库表的主键
        public int id { get; set; } // 性别唯一标识 ID 属性

        [Required(ErrorMessage = "性别名称是必填项")] // 设置为必填项并定义验证失败时的提示消息
        [StringLength(20)] // 限制对应字符串的最大长度为 20 个字符
        public string name { get; set; } = null!; // 性别名称属性（例如 "Male", "Female" 等）

        /// <summary>
        /// 性别状态（0: 停用, 1: 启用）
        /// </summary>
        [Required]
        [Range(0, 1, ErrorMessage = "状态值必须为 0 或 1")]
        public int status { get; set; } = 1; // 属性状态是否有效，默认为启用（1）
    }
}