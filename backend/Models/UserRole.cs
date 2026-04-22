namespace MedicalSystem.Models
{
    /// <summary>
    /// 系统用户角色定义
    /// </summary>
    public enum UserRole
    {
        SuperAdmin = 0, // 超级管理员
        Admin = 1,      // 普通管理员
        Doctor = 2,     // 医生
        Patient = 3     // 病人
    }
}