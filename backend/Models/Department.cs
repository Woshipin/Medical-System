// backend/Models/Department.cs
namespace MedicalSystem.Models // 将原来的 backend 修改和统一为 MedicalSystem.Models 命名空间
{
    public class Department // 定义 Department 科室实体类
    {
        public int Id { get; set; } // 科室的唯一主键 ID 属性

        public string Name { get; set; } = null!; // 科室名称属性，默认初始化为非空

        public string Location { get; set; } = null!; // 科室在院内的具体建筑地址或楼层位置属性，默认初始化为非空

        public bool IsActive { get; set; } // 科室是否激活并正常接诊的布尔值属性
    }
}