// backend/Models/Department.cs
namespace MedicalSystem.Models // 这里从 backend 改成 MedicalSystem
{
    public class Department
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Location { get; set; }
        public bool IsActive { get; set; }
    }
}