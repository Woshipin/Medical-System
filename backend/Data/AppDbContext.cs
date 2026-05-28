using Microsoft.AspNetCore.Identity; // 引入 ASP.NET Core Identity 命名空间，提供用户和角色认证的基础管理
using Microsoft.AspNetCore.Identity.EntityFrameworkCore; // 引入支持 Identity 架构的 EF Core 数据上下文基类包
using Microsoft.EntityFrameworkCore; // 引入 Entity Framework Core 的核心库命名空间，提供数据库访问支持
using MedicalSystem.Models; // 引入本项目中的领域实体类命名空间，包括 User, Doctor, Gender 等模型
using System; // 引入系统基础命名空间，提供 DateTime 以及基础的类型支持
using System.Threading; // 引入线程命名空间以支持 CancellationToken
using System.Threading.Tasks; // 引入异步任务命名空间

namespace MedicalSystem.Data // 声明数据访问层所在的命名空间
{
    public class AppDbContext : IdentityDbContext<User, IdentityRole<int>, int> // 定义 AppDbContext 类，继承自支持 int 主键类型的 Identity 上下文基类
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { } // 定义带数据库连接参数的构造函数，并传入基类进行初始化

        public DbSet<Doctor> Doctors { get; set; } = null!; // 定义并注册 Doctors（医生信息）数据集映射，默认初始化为空引用占位
        public DbSet<Gender> Genders { get; set; } = null!; // 定义并注册 Genders（性别）数据集映射，默认初始化为空引用占位
        public DbSet<Department> Departments { get; set; } = null!; // 定义并注册 Departments（科室部门）数据集映射，默认初始化为空引用占位
        public DbSet<ActivityLog> ActivityLogs { get; set; } = null!; // 定义并注册 ActivityLogs（系统日志）数据集映射，默认初始化为空引用占位
        
        // ==================== 基础字典与组织架构实体 ====================
        public DbSet<Specialty> Specialties { get; set; } = null!; // 定义并注册 Specialties（专科表）数据集映射
        public DbSet<Title> Titles { get; set; } = null!; // 定义并注册 Titles（职称表）数据集映射
        public DbSet<OfficeLocation> OfficeLocations { get; set; } = null!; // 定义并注册 OfficeLocations（诊室位置表）数据集映射

        // ==================== 新增注册双 Token 实体集 ====================
        public DbSet<UserRefreshToken> UserRefreshTokens { get; set; } = null!; // 注册用于安全认证校验的 Refresh Token 存储集

        public override Task<int> SaveChangesAsync(CancellationToken ct = default) // 覆写 EF Core 的异步数据保存方法，自动更新最后编辑时间
        {
            var entries = ChangeTracker.Entries<User>() // 通过 EF 变更追踪器抓取当前处于内存中的 User 实体列表
                .Where(e => e.State == EntityState.Modified); // 过滤并筛选出其中状态处于 Modified（已修改）状态的记录

            foreach (var entry in entries) // 循环遍历每一个正在被修改 of User 实体数据
            {
                // 使用规范的 PascalCase 属性，并建议统一采用 UTC 时间规避服务器时区差异
                entry.Entity.UpdatedAt = DateTime.UtcNow; 
            }
            return base.SaveChangesAsync(ct); // 调用基类原生异步保存方法完成物理入库，并返回影响行数
        }

        protected override void OnModelCreating(ModelBuilder builder) // 覆写数据库结构、主外键关系以及初始数据注入的配置方法
        {
            base.OnModelCreating(builder); // 必须首先调用基类方法以确保 Identity 安全框架的内置约束关系能被正确加载

            builder.Entity<User>(entity => // 对核心 User 实体进行数据库底层表结构和列顺序的精细化 Fluent API 设置
            {
                entity.ToTable("Users"); // 映射当前 User 实体到 MySQL 中的物理表名为 "Users"

                // ==================== 1. 自定义扩展业务字段（排在表结构最前面 1 - 17 列） ====================
                entity.Property(u => u.Id).HasColumnName("id").HasColumnOrder(1); 
                entity.Property(u => u.FullName).HasColumnName("full_name").HasColumnOrder(2); 
                entity.Property(u => u.GenderId).HasColumnName("gender_id").HasColumnOrder(3); 
                entity.Property(u => u.DateOfBirth).HasColumnName("date_of_birth").HasColumnOrder(4); 
                entity.Property(u => u.PhoneNumber).HasColumnName("phone_number").HasColumnOrder(5); // 主要联系电话
                entity.Property(u => u.PhoneNumberAlt).HasColumnName("phone_number_alt").HasColumnOrder(6); // 备用电话
                entity.Property(u => u.ProfileImageUrl).HasColumnName("profile_image_url").HasColumnOrder(7); 
                entity.Property(u => u.AddressLine1).HasColumnName("address_line_1").HasColumnOrder(8); 
                entity.Property(u => u.AddressLine2).HasColumnName("address_line_2").HasColumnOrder(9); 
                entity.Property(u => u.City).HasColumnName("city").HasColumnOrder(10); 
                entity.Property(u => u.State).HasColumnName("state").HasColumnOrder(11); 
                entity.Property(u => u.PostalCode).HasColumnName("postal_code").HasColumnOrder(12); 
                entity.Property(u => u.Country).HasColumnName("country").HasColumnOrder(13); 
                entity.Property(u => u.Role).HasColumnName("role").HasColumnOrder(14); 
                entity.Property(u => u.Status).HasColumnName("status").HasColumnOrder(15); 
                entity.Property(u => u.CreatedAt).HasColumnName("created_at").HasColumnOrder(16); 
                entity.Property(u => u.UpdatedAt).HasColumnName("updated_at").HasColumnOrder(17);

                // ==================== 2. Identity 框架底层内置系统字段（排在表结构最后面 18 - 30 列） ====================
                entity.Property(u => u.UserName).HasColumnOrder(18); 
                entity.Property(u => u.NormalizedUserName).HasColumnOrder(19); 
                entity.Property(u => u.Email).HasColumnName("email").HasColumnOrder(20); 
                entity.Property(u => u.NormalizedEmail).HasColumnOrder(21); 
                entity.Property(u => u.EmailConfirmed).HasColumnOrder(22); 
                entity.Property(u => u.PasswordHash).HasColumnName("password").HasColumnOrder(23); 
                entity.Property(u => u.SecurityStamp).HasColumnOrder(24); 
                entity.Property(u => u.ConcurrencyStamp).HasColumnOrder(25); 
                entity.Property(u => u.PhoneNumberConfirmed).HasColumnOrder(26); 
                entity.Property(u => u.TwoFactorEnabled).HasColumnOrder(27); 
                entity.Property(u => u.LockoutEnd).HasColumnOrder(28); 
                entity.Property(u => u.LockoutEnabled).HasColumnOrder(29); 
                entity.Property(u => u.AccessFailedCount).HasColumnOrder(30); 
            });

            // ==================== 关联关系与索引配置 ====================
            builder.Entity<UserRefreshToken>(entity =>
            {
                // 为 Token 字段创建唯一索引，便于高效检索，提高接口响应性能
                entity.HasIndex(rt => rt.Token).IsUnique();
            });

            builder.Entity<IdentityRole<int>>().ToTable("Roles"); // 重命名 Identity 核心内置角色表名为 "Roles"
            builder.Entity<IdentityUserRole<int>>().ToTable("UserRoles"); // 重命名用户与角色多对多关联映射表名为 "UserRoles"
            builder.Entity<IdentityUserClaim<int>>().ToTable("UserClaims"); // 重命名用户系统声明表名为 "UserClaims"
            builder.Entity<IdentityUserLogin<int>>().ToTable("UserLogins"); // 重命名第三方外部登录账号映射表名为 "UserLogins"
            builder.Entity<IdentityRoleClaim<int>>().ToTable("RoleClaims"); // 重命名系统角色对应的权限声明表名为 "RoleClaims"
            builder.Entity<IdentityUserToken<int>>().ToTable("UserTokens"); // 重命名安全框架下用户登录令牌暂存表名为 "UserTokens"

            // ==================== 静态基础数据注入（种子数据） ====================

            builder.Entity<Gender>().HasData(
                new Gender { id = 1, name = "Male", status = 1 }, 
                new Gender { id = 2, name = "Female", status = 1 } 
            );

            builder.Entity<Department>().HasData(
                new Department { id = 1, name = "Emergency Department (ER)", location = "Block A, Level 1", status = 1 },
                new Department { id = 2, name = "Cardiology", location = "Block B, Level 3", status = 1 },
                new Department { id = 3, name = "Neurology", location = "Block B, Level 4", status = 1 },
                new Department { id = 4, name = "Pediatrics", location = "Block C, Level 2", status = 1 },
                new Department { id = 5, name = "Oncology", location = "Block D, Level 1", status = 1 },
                new Department { id = 6, name = "Orthopedics", location = "Block A, Level 2", status = 1 },
                new Department { id = 7, name = "General Surgery", location = "Block A, Level 3", status = 1 },
                new Department { id = 8, name = "Intensive Care Unit (ICU)", location = "Block A, Level 4", status = 1 },
                new Department { id = 9, name = "Radiology & Imaging", location = "Block C, Basement 1", status = 1 },
                new Department { id = 10, name = "Pharmacy", location = "Block A, Level 1", status = 1 },
                new Department { id = 11, name = "Obstetrics and Gynecology", location = "Block C, Level 3", status = 1 },
                new Department { id = 12, name = "Dental Clinic", location = "Block B, Level 1", status = 0 }
            );

            var hasher = new PasswordHasher<User>(); // 实例化密码哈希加密器对象
            var seedDate = new DateTime(2026, 5, 25, 0, 0, 0, DateTimeKind.Utc); // 创建并保存一个固定的静态初始时间对象，防止反复生成无意义的迁移文件变动

            builder.Entity<Specialty>().HasData(
                new Specialty { id = 1, name = "General Cardiology", status = 1, created_at = seedDate, updated_at = seedDate },
                new Specialty { id = 2, name = "Clinical Neurology", status = 1, created_at = seedDate, updated_at = seedDate },
                new Specialty { id = 3, name = "Pediatrics Care", status = 1, created_at = seedDate, updated_at = seedDate }
            );

            builder.Entity<Title>().HasData(
                new Title { id = 1, name = "Chief Physician", status = 1, created_at = seedDate, updated_at = seedDate },
                new Title { id = 2, name = "Associate Chief Physician", status = 1, created_at = seedDate, updated_at = seedDate },
                new Title { id = 3, name = "Attending Physician", status = 1, created_at = seedDate, updated_at = seedDate }
            );

            builder.Entity<OfficeLocation>().HasData(
                new OfficeLocation { id = 1, name = "Consultation Room 101 (Block A, Level 1)", status = 1, created_at = seedDate, updated_at = seedDate },
                new OfficeLocation { id = 2, name = "Consultation Room 302 (Block B, Level 3)", status = 1, created_at = seedDate, updated_at = seedDate }
            );

            // ==================== 初始种子用户注入（修正字段命名） ====================

            var userPin = new User
            {
                Id = 1,
                FullName = "pin", 
                Email = "pin@gmail.com",
                NormalizedEmail = "PIN@GMAIL.COM",
                UserName = "pin@gmail.com",
                NormalizedUserName = "PIN@GMAIL.COM",
                PhoneNumber = "88888888",
                GenderId = 1, 
                Role = UserRole.Patient, 
                Status = 1, 
                CreatedAt = seedDate, 
                UpdatedAt = seedDate, 
                SecurityStamp = "f4c9c7d1-e6df-46b0-9b62-fa583db13d5a",
                ConcurrencyStamp = "a72b83c1-0c5a-4e67-8fa6-fb2a6cf124de"
            };
            userPin.PasswordHash = hasher.HashPassword(userPin, "Pin@776253");

            var userSuperAdmin = new User
            {
                Id = 2,
                FullName = "superadmin",
                Email = "superadmin@gmail.com",
                NormalizedEmail = "SUPERADMIN@GMAIL.COM",
                UserName = "superadmin@gmail.com",
                NormalizedUserName = "SUPERADMIN@GMAIL.COM",
                PhoneNumber = "88888888",
                GenderId = 1,
                Role = UserRole.SuperAdmin,
                Status = 1,
                CreatedAt = seedDate,
                UpdatedAt = seedDate,
                SecurityStamp = "c95e1e0a-bf6b-4df2-823a-fcf723fbfa4b",
                ConcurrencyStamp = "b84f93c1-cd2c-47ea-bcbf-11fc2cf00de8"
            };
            userSuperAdmin.PasswordHash = hasher.HashPassword(userSuperAdmin, "Pin@776253");

            var userAdmin = new User
            {
                Id = 3,
                FullName = "admin",
                Email = "admin@gmail.com",
                NormalizedEmail = "ADMIN@GMAIL.COM",
                UserName = "admin@gmail.com",
                NormalizedUserName = "ADMIN@GMAIL.COM",
                PhoneNumber = "88888888",
                GenderId = 1,
                Role = UserRole.Admin,
                Status = 1,
                CreatedAt = seedDate,
                UpdatedAt = seedDate,
                SecurityStamp = "e74c83fa-da13-4cb2-83b6-9df2cfd1e3ca",
                ConcurrencyStamp = "d85fbc2a-1c3c-41ca-a2bf-23fc3df11de9"
            };
            userAdmin.PasswordHash = hasher.HashPassword(userAdmin, "Pin@776253");

            var userDoctor = new User
            {
                Id = 4,
                FullName = "doctor",
                Email = "doctor@gmail.com",
                NormalizedEmail = "DOCTOR@GMAIL.COM",
                UserName = "doctor@gmail.com",
                NormalizedUserName = "DOCTOR@GMAIL.COM",
                PhoneNumber = "88888888",
                GenderId = 1,
                Role = UserRole.Doctor,
                Status = 1,
                CreatedAt = seedDate,
                UpdatedAt = seedDate,
                SecurityStamp = "a18d9bc1-df8a-4412-bd7c-2ef3cfb1c19b",
                ConcurrencyStamp = "f42fbc1a-5c2c-48ca-9dbf-34fc4df22de7"
            };
            userDoctor.PasswordHash = hasher.HashPassword(userDoctor, "Pin@776253");

            var userPatient = new User
            {
                Id = 5,
                FullName = "patient",
                Email = "patient@gmail.com",
                NormalizedEmail = "PATIENT@GMAIL.COM",
                UserName = "patient@gmail.com",
                NormalizedUserName = "PATIENT@GMAIL.COM",
                PhoneNumber = "88888888",
                GenderId = 1,
                Role = UserRole.Patient,
                Status = 1,
                CreatedAt = seedDate,
                UpdatedAt = seedDate,
                SecurityStamp = "94fcbc12-d61a-4c91-9cb6-1ef2cfc3a5de",
                ConcurrencyStamp = "e95abc2d-0f9c-4df6-8fb2-14ac7df38de4"
            };
            userPatient.PasswordHash = hasher.HashPassword(userPatient, "Pin@776253");

            builder.Entity<User>().HasData(userPin, userSuperAdmin, userAdmin, userDoctor, userPatient); // 向 Users 物理表注册默认初始种子用户
        }
    }
}