using System.ComponentModel.DataAnnotations; // 引入数据注解命名空间，用于配置属性验证和数据库映射

namespace MedicalSystem.Models // 声明实体模型所在的命名空间
{
    /// <summary>
    /// 性别定义表
    /// </summary>
    public class Gender // 定义 Gender 实体类
    {
        [Key] // 标识当前属性为数据库表的主键
        public int Id { get; set; } // 性别唯一标识 ID 属性

        [Required(ErrorMessage = "性别名称是必填项")] // 设置为必填项并定义验证失败时的提示消息
        [StringLength(20)] // 限制对应字符串的最大长度为 20 个字符
        public string Name { get; set; } = null!; // 性别名称属性（例如 "Male", "Female" 等），默认初始化为非空

        public bool IsActive { get; set; } = true; // 属性状态是否有效，默认为启用（true）
    }
}