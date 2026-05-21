using Microsoft.AspNetCore.Identity; // 引入 ASP.NET Core Identity 命名空间
using Microsoft.AspNetCore.Identity.EntityFrameworkCore; // 引入支持 Identity 架构的 EF Core 数据上下文包
using Microsoft.EntityFrameworkCore; // 引入 Entity Framework Core 的核心库命名空间
using MedicalSystem.Models; // 引入本项目中的领域实体类命名空间

namespace MedicalSystem.Data // 声明数据访问层所在的命名空间
{
    public class AppDbContext : IdentityDbContext<User, IdentityRole<int>, int> // 定义 AppDbContext 类，继承自支持 int 类型主键的 IdentityDbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { } // 定义带数据库连接参数的构造函数，并传入基类进行初始化

        public DbSet<Doctor> Doctors { get; set; } = null!; // 定义 Doctors（医生）数据集映射，允许不为空
        public DbSet<Gender> Genders { get; set; } = null!; // 定义 Genders（性别）数据集映射，允许不为空
        public DbSet<Department> Departments { get; set; } = null!; // 定义 Departments（部门）数据集映射，允许不为空
        // 在已有的 DbSet 声明区域中，添加下面这一行：
        public DbSet<ActivityLog> ActivityLogs { get; set; } = null!; // 注册操作日志数据集，映射到数据库中的 ActivityLogs 表

        // 自动更新时间戳逻辑
        public override Task<int> SaveChangesAsync(CancellationToken ct = default) // 覆写 EF Core 的异步持久化方法
        {
            var entries = ChangeTracker.Entries<User>() // 获取当前变更追踪器中追踪的 User 实体列表
                .Where(e => e.State == EntityState.Modified); // 过滤筛选出状态为 Modified（已修改）的实体项

            foreach (var entry in entries) // 循环遍历每一个被修改的 User 实体
            {
                entry.Entity.UpdatedAt = DateTime.Now; // 在提交数据库前自动将 UpdatedAt（修改时间）设置为当前系统时间
            }
            return base.SaveChangesAsync(ct); // 调用基类原生方法完成数据物理入库操作
        }

        protected override void OnModelCreating(ModelBuilder builder) // 覆写实体模型映射和关系的构建配置方法
        {
            base.OnModelCreating(builder); // 必须首先调用基类方法以确保 Identity 原生表的配置关系能够加载

            // 配置 Users 表及其列名映射
            builder.Entity<User>(entity => // 对 User 实体的数据库表及字段映射进行精细化设置
            {
                entity.ToTable("Users"); // 映射当前 User 实体到物理表名 "Users"
                // 强制将内置 Email 字段在数据库中显示为 Email (首字母大写)
                entity.Property(u => u.Email).HasColumnName("Email"); // 重新指定 Email 列的名字，以确保大小写拼写符合特定规范
                // 确保 PasswordHash 等字段依然存在但不影响你要求的 Header 显示
            }); // 结束 User 实体特殊规则配置

            // 简化其他 Identity 表名
            builder.Entity<IdentityRole<int>>().ToTable("Roles"); // 重命名默认角色表为 "Roles"
            builder.Entity<IdentityUserRole<int>>().ToTable("UserRoles"); // 重命名用户角色映射表为 "UserRoles"
            builder.Entity<IdentityUserClaim<int>>().ToTable("UserClaims"); // 重命名用户声明表为 "UserClaims"
            builder.Entity<IdentityUserLogin<int>>().ToTable("UserLogins"); // 重命名用户第三方登录映射表为 "UserLogins"
            builder.Entity<IdentityRoleClaim<int>>().ToTable("RoleClaims"); // 重命名角色声明表为 "RoleClaims"
            builder.Entity<IdentityUserToken<int>>().ToTable("UserTokens"); // 重命名用户令牌存储表为 "UserTokens"

            // 初始化种子数据
            builder.Entity<Gender>().HasData( // 在系统首次创建数据库时向性别表注入默认初始化记录
                new Gender { Id = 1, Name = "Male", IsActive = true }, // 注入主键 ID 为 1，性别名为 "Male" 的数据
                new Gender { Id = 2, Name = "Female", IsActive = true } // 注入主键 ID 为 2，性别名为 "Female" 的数据
            ); // 性别表种子数据注入配置结束

            // ==========================================
            // 新增：初始化 Department (科室) 种子数据
            // ==========================================
            builder.Entity<Department>().HasData( // 向 Department（部门）表中预置必要的默认医疗科室记录
                new Department { Id = 1, Name = "Emergency Department (ER)", Location = "Block A, Level 1", IsActive = true }, // 注入急诊科数据
                new Department { Id = 2, Name = "Cardiology", Location = "Block B, Level 3", IsActive = true }, // 注入心脏内科数据
                new Department { Id = 3, Name = "Neurology", Location = "Block B, Level 4", IsActive = true }, // 注入神经内科数据
                new Department { Id = 4, Name = "Pediatrics", Location = "Block C, Level 2", IsActive = true }, // 注入儿科数据
                new Department { Id = 5, Name = "Oncology", Location = "Block D, Level 1", IsActive = true }, // 注入肿瘤科数据
                new Department { Id = 6, Name = "Orthopedics", Location = "Block A, Level 2", IsActive = true }, // 注入骨科数据
                new Department { Id = 7, Name = "General Surgery", Location = "Block A, Level 3", IsActive = true }, // 注入普外科数据
                new Department { Id = 8, Name = "Intensive Care Unit (ICU)", Location = "Block A, Level 4", IsActive = true }, // 注入重症监护室数据
                new Department { Id = 9, Name = "Radiology & Imaging", Location = "Block C, Basement 1", IsActive = true }, // 注入放射和影像诊断科数据
                new Department { Id = 10, Name = "Pharmacy", Location = "Block A, Level 1", IsActive = true }, // 注入药房数据
                new Department { Id = 11, Name = "Obstetrics and Gynecology", Location = "Block C, Level 3", IsActive = true }, // 注入妇产科数据
                new Department { Id = 12, Name = "Dental Clinic", Location = "Block B, Level 1", IsActive = false } // 注入牙医诊所数据（当前处于非启用状态）
            ); // 科室表种子数据注入配置结束
        } // OnModelCreating 方法结束
    } // AppDbContext 类定义结束
} // 命名空间结束