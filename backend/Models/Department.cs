namespace MedicalSystem.Models // 统一为 MedicalSystem.Models 命名空间
{
    public class Department // 定义 Department 科室实体类
    {
        public int id { get; set; } // 科室的唯一主键 ID 属性

        public string name { get; set; } = null!; // 科室名称属性

        public string location { get; set; } = null!; // 科室在院内的具体建筑地址或楼层位置属性

        // 【修改】：is_active 改为 status
        public bool status { get; set; } // 科室是否激活并正常接诊的布尔值属性
    }
}