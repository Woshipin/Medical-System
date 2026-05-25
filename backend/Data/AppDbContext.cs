using Microsoft.AspNetCore.Identity; // 引入 ASP.NET Core Identity 命名空间，提供用户和角色认证的基础管理
using Microsoft.AspNetCore.Identity.EntityFrameworkCore; // 引入支持 Identity 架构的 EF Core 数据上下文基类包
using Microsoft.EntityFrameworkCore; // 引入 Entity Framework Core 的核心库命名空间，提供数据库访问支持
using MedicalSystem.Models; // 引入本项目中的领域实体类命名空间，包括 User, Doctor, Gender 等模型
using System; // 引入系统基础命名空间，提供 DateTime 以及基础的类型支持

namespace MedicalSystem.Data // 声明数据访问层所在的命名空间
{ // 命名空间开始大括号
    public class AppDbContext : IdentityDbContext<User, IdentityRole<int>, int> // 定义 AppDbContext 类，继承自支持 int 主键类型的 Identity 上下文基类
    { // 类定义开始大括号
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { } // 定义带数据库连接参数的构造函数，并传入基类进行初始化

        public DbSet<Doctor> Doctors { get; set; } = null!; // 定义并注册 Doctors（医生信息）数据集映射，默认初始化为空引用占位
        public DbSet<Gender> Genders { get; set; } = null!; // 定义并注册 Genders（性别）数据集映射，默认初始化为空引用占位
        public DbSet<Department> Departments { get; set; } = null!; // 定义并注册 Departments（科室部门）数据集映射，默认初始化为空引用占位
        public DbSet<ActivityLog> ActivityLogs { get; set; } = null!; // 定义并注册 ActivityLogs（系统日志）数据集映射，默认初始化为空引用占位

        public override Task<int> SaveChangesAsync(CancellationToken ct = default) // 覆写 EF Core 的异步数据持久化保存方法，加入时间戳逻辑
        { // 方法体开始大括号
            var entries = ChangeTracker.Entries<User>() // 通过 EF 变更追踪器抓取当前正处于内存中的 User 实体列表
                .Where(e => e.State == EntityState.Modified); // 过滤并筛选出其中状态处于 Modified（已修改）状态的记录

            foreach (var entry in entries) // 循环遍历每一个正在被修改的 User 实体数据
            { // 循环体开始大括号
                entry.Entity.updated_at = DateTime.Now; // 在物理提交入库前，自动更新其 updated_at（最后修改时间）为当前系统时间
            } // 循环体结束大括号
            return base.SaveChangesAsync(ct); // 调用基类原生异步保存方法完成物理入库，并返回影响行数
        } // 方法体结束大括号

        protected override void OnModelCreating(ModelBuilder builder) // 覆写数据库结构、主外键关系以及初始数据注入的配置方法
        { // 方法体开始大括号
            base.OnModelCreating(builder); // 必须首先调用基类方法以确保 Identity 安全框架的内置约束关系能被正确加载

            builder.Entity<User>(entity => // 对核心 User 实体进行数据库底层表结构和列顺序的精细化 Fluent API 设置
            { // 配置代码块开始大括号
                entity.ToTable("Users"); // 映射当前 User 实体到 MySQL 中的物理表名为 "Users"

                entity.Property(u => u.Id).HasColumnName("id").HasColumnOrder(1); // 映射主键 Id 到物理列 "id"，并强行指定排在数据库第 1 列
                entity.Property(u => u.full_name).HasColumnName("full_name").HasColumnOrder(2); // 映射真实姓名 full_name 到物理列 "full_name"，并指定排在第 2 列
                entity.Property(u => u.Email).HasColumnName("email").HasColumnOrder(3); // 映射内置 Email 到物理列 "email"，并指定排在数据库第 3 列
                entity.Property(u => u.PhoneNumber).HasColumnName("phone_number").HasColumnOrder(4); // 映射内置 PhoneNumber 到物理列 "phone_number"，并指定排在第 4 列
                entity.Property(u => u.gender_id).HasColumnName("gender_id").HasColumnOrder(5); // 映射关联性别 gender_id 到物理列 "gender_id"，并指定排在数据库第 5 列
                entity.Property(u => u.PasswordHash).HasColumnName("password").HasColumnOrder(6); // 映射密码哈希列到物理列 "password"，并指定排在数据库第 6 列
                entity.Property(u => u.status).HasColumnName("status").HasColumnOrder(7); // 映射账号状态 status 到物理列 "status"，并指定排在数据库第 7 列
                entity.Property(u => u.role).HasColumnName("role").HasColumnOrder(8); // 映射用户角色 role 到物理列 "role"，并指定排在数据库第 8 列
                entity.Property(u => u.created_at).HasColumnName("created_at").HasColumnOrder(9); // 映射创建时间 created_at 到物理列 "created_at"，并指定排在数据库第 9 列
                entity.Property(u => u.updated_at).HasColumnName("updated_at").HasColumnOrder(10); // 映射更新时间 updated_at 到物理列 "updated_at"，并指定排在数据库第 10 列

                entity.Property(u => u.UserName).HasColumnOrder(11); // 强制将 Identity 框架内部属性 UserName 顺序排序到右侧第 11 列
                entity.Property(u => u.NormalizedUserName).HasColumnOrder(12); // 强制将标准大写用户名 NormalizedUserName 排序到右侧第 12 列
                entity.Property(u => u.NormalizedEmail).HasColumnOrder(13); // 强制将标准大写邮箱 NormalizedEmail 排序到右侧第 13 列
                entity.Property(u => u.EmailConfirmed).HasColumnOrder(14); // 强制将邮箱确认标识 EmailConfirmed 排序到右侧第 14 列
                entity.Property(u => u.SecurityStamp).HasColumnOrder(15); // 强制将防伪安全标记 SecurityStamp 排序到右侧第 15 列
                entity.Property(u => u.ConcurrencyStamp).HasColumnOrder(16); // 强制将并发标记 ConcurrencyStamp 排序到右侧第 16 列
                entity.Property(u => u.PhoneNumberConfirmed).HasColumnOrder(17); // 强制将电话确认标识 PhoneNumberConfirmed 排序到右侧第 17 列
                entity.Property(u => u.TwoFactorEnabled).HasColumnOrder(18); // 强制将双因子认证标识 TwoFactorEnabled 排序到右侧第 18 列
                entity.Property(u => u.LockoutEnd).HasColumnOrder(19); // 强制将锁定结束时间 LockoutEnd 排序到右侧第 19 列
                entity.Property(u => u.LockoutEnabled).HasColumnOrder(20); // 强制将锁定启用状态 LockoutEnabled 排序到右侧第 20 列
                entity.Property(u => u.AccessFailedCount).HasColumnOrder(21); // 强制将登录失败次数计数器 AccessFailedCount 排序到右侧第 21 列
            }); // 配置代码块结束大括号

            builder.Entity<IdentityRole<int>>().ToTable("Roles"); // 重命名 Identity 核心内置角色表名为 "Roles"
            builder.Entity<IdentityUserRole<int>>().ToTable("UserRoles"); // 重命名用户与角色多对多关联映射表名为 "UserRoles"
            builder.Entity<IdentityUserClaim<int>>().ToTable("UserClaims"); // 重命名用户系统声明表名为 "UserClaims"
            builder.Entity<IdentityUserLogin<int>>().ToTable("UserLogins"); // 重命名第三方外部登录账号映射表名为 "UserLogins"
            builder.Entity<IdentityRoleClaim<int>>().ToTable("RoleClaims"); // 重命名系统角色对应的权限声明表名为 "RoleClaims"
            builder.Entity<IdentityUserToken<int>>().ToTable("UserTokens"); // 重命名安全框架下用户登录令牌暂存表名为 "UserTokens"

            builder.Entity<Gender>().HasData( // 向数据库中的 Gender（性别表）注入初始化种子记录
                new Gender { id = 1, name = "Male", status = true }, // 注入主键 id 为 1 且名称为 "Male" 的默认激活男女性别数据
                new Gender { id = 2, name = "Female", status = true } // 注入主键 id 为 2 且名称为 "Female" 的默认激活女性性别数据
            ); // 结束性别表的种子数据注入操作

            builder.Entity<Department>().HasData( // 向数据库中的 Department（科室部门表）注入初始化的医院核心科室种子记录
                new Department { id = 1, name = "Emergency Department (ER)", location = "Block A, Level 1", status = true }, // 写入急诊科部门种子数据
                new Department { id = 2, name = "Cardiology", location = "Block B, Level 3", status = true }, // 写入心脏内科部门种子数据
                new Department { id = 3, name = "Neurology", location = "Block B, Level 4", status = true }, // 写入神经内科部门种子数据
                new Department { id = 4, name = "Pediatrics", location = "Block C, Level 2", status = true }, // 写入儿科部门种子数据
                new Department { id = 5, name = "Oncology", location = "Block D, Level 1", status = true }, // 写入肿瘤科部门种子数据
                new Department { id = 6, name = "Orthopedics", location = "Block A, Level 2", status = true }, // 写入骨科部门种子数据
                new Department { id = 7, name = "General Surgery", location = "Block A, Level 3", status = true }, // 写入普外科部门种子数据
                new Department { id = 8, name = "Intensive Care Unit (ICU)", location = "Block A, Level 4", status = true }, // 写入重症监护室部门种子数据
                new Department { id = 9, name = "Radiology & Imaging", location = "Block C, Basement 1", status = true }, // 写入放射和影像中心部门种子数据
                new Department { id = 10, name = "Pharmacy", location = "Block A, Level 1", status = true }, // 写入药房部门种子数据
                new Department { id = 11, name = "Obstetrics and Gynecology", location = "Block C, Level 3", status = true }, // 写入妇产科部门种子数据
                new Department { id = 12, name = "Dental Clinic", location = "Block B, Level 1", status = false } // 写入牙医诊所部门种子数据（当前处于未启用状态）
            ); // 结束科室表的种子数据注入操作

            var hasher = new PasswordHasher<User>(); // 实例化 ASP.NET Core Identity 内置的通用不可逆密码哈希加密器对象
            var seedDate = new DateTime(2026, 5, 25, 0, 0, 0, DateTimeKind.Utc); // 创建并保存一个固定的静态初始时间对象，防止反复生成无意义的迁移文件变动

            var userPin = new User // 实例化第一个初始化用户 pin 的实体对象
            { // 用户属性赋值块开始大括号
                Id = 1, // 强行指定主键 id 为数值 1
                full_name = "pin", // 设置该初始用户的真实姓名为 "pin"
                Email = "pin@gmail.com", // 设置该用户的登录电子邮箱为 "pin@gmail.com"
                NormalizedEmail = "PIN@GMAIL.COM", // 设置统一规格化的大写邮箱用于系统索引查找
                UserName = "pin@gmail.com", // 设置登录用户名同电子邮箱账号一致
                NormalizedUserName = "PIN@GMAIL.COM", // 设置统一规格化的大写登录用户名
                PhoneNumber = "88888888", // 设置用户的固定电话号码为 "88888888"
                gender_id = 1, // 设置该用户的性别关联 id 为 1 (Male)
                role = UserRole.Patient, // 关联用户的业务角色为患者 Patient
                status = true, // 设置该初始用户账号的状态为启用
                created_at = seedDate, // 赋予静态设定的系统账号创建日期
                updated_at = seedDate, // 赋予静态设定的系统账号更新日期
                SecurityStamp = "f4c9c7d1-e6df-46b0-9b62-fa583db13d5a", // 注入手动设定的固定全局防伪标志安全戳
                ConcurrencyStamp = "a72b83c1-0c5a-4e67-8fa6-fb2a6cf124de" // 注入手动设定的并发锁控制戳，防止数据覆写冲突
            }; // 用户属性赋值块结束大括号
            userPin.PasswordHash = hasher.HashPassword(userPin, "Pin@776253"); // 使用哈希加密器对 "Pin@776253" 进行处理并保存到 PasswordHash 字段

            var userSuperAdmin = new User // 实例化第二个初始超级管理员 superadmin 用户实体对象
            { // 用户属性赋值块开始大括号
                Id = 2, // 强行指定主键 id 为数值 2
                full_name = "superadmin", // 设置该超级管理员的真实姓名为 "superadmin"
                Email = "superadmin@gmail.com", // 设置登录电子邮箱为 "superadmin@gmail.com"
                NormalizedEmail = "SUPERADMIN@GMAIL.COM", // 设置标准索引大写邮箱
                UserName = "superadmin@gmail.com", // 设置登录用户名同邮箱完全一致
                NormalizedUserName = "SUPERADMIN@GMAIL.COM", // 设置标准索引大写用户名
                PhoneNumber = "88888888", // 设置联系电话为统一的 "88888888"
                gender_id = 1, // 关联性别 id 为 1 (Male)
                role = UserRole.SuperAdmin, // 设定系统内的业务角色为超级管理员 SuperAdmin
                status = true, // 初始激活当前账号的状态为正常启用
                created_at = seedDate, // 绑定种子账号创建静态时间
                updated_at = seedDate, // 绑定种子账号最后修改静态时间
                SecurityStamp = "c95e1e0a-bf6b-4df2-823a-fcf723fbfa4b", // 设定用于检验的固定安全校验安全戳
                ConcurrencyStamp = "b84f93c1-cd2c-47ea-bcbf-11fc2cf00de8" // 设定数据库隔离级别的固定并发控制戳
            }; // 用户属性赋值块结束大括号
            userSuperAdmin.PasswordHash = hasher.HashPassword(userSuperAdmin, "Pin@776253"); // 对指定密码 "Pin@776253" 进行哈希处理并绑定到物理密码字段

            var userAdmin = new User // 实例化第三个普通管理员 admin 用户实体对象
            { // 用户属性赋值块开始大括号
                Id = 3, // 强行指定主键 id 为数值 3
                full_name = "admin", // 设置该普通管理员的真实名称为 "admin"
                Email = "admin@gmail.com", // 设置登录电子邮箱为 "admin@gmail.com"
                NormalizedEmail = "ADMIN@GMAIL.COM", // 设置大写规格化检索邮箱
                UserName = "admin@gmail.com", // 设置登录主账户名同邮箱相同
                NormalizedUserName = "ADMIN@GMAIL.COM", // 设置大写规格化检索用户名
                PhoneNumber = "88888888", // 统一联系方式设为 "88888888"
                gender_id = 1, // 关联性别为男 1 (Male)
                role = UserRole.Admin, // 设置系统角色标识为管理员 Admin
                status = true, // 开启当前管理员账号的启用状态
                created_at = seedDate, // 设置账号的生成时间戳为静态日期
                updated_at = seedDate, // 设置账号的最后更新时间戳为静态日期
                SecurityStamp = "e74c83fa-da13-4cb2-83b6-9df2cfd1e3ca", // 设置安全校验静态 GUID 戳
                ConcurrencyStamp = "d85fbc2a-1c3c-41ca-a2bf-23fc3df11de9" // 设置多线程修改防冲突的物理并发标记戳
            }; // 用户属性赋值块结束大括号
            userAdmin.PasswordHash = hasher.HashPassword(userAdmin, "Pin@776253"); // 采用不可逆加密处理此密码，并将结果赋予物理 PasswordHash 字段

            var userDoctor = new User // 实例化第四个医生 doctor 用户实体对象
            { // 用户属性赋值块开始大括号
                Id = 4, // 强行指定主键 id 为数值 4
                full_name = "doctor", // 设置该医生用户的真实名称为 "doctor"
                Email = "doctor@gmail.com", // 设定登录电子邮箱地址为 "doctor@gmail.com"
                NormalizedEmail = "DOCTOR@GMAIL.COM", // 设定大写数据库检索邮箱
                UserName = "doctor@gmail.com", // 设置登录用户名同邮箱地址完全一致
                NormalizedUserName = "DOCTOR@GMAIL.COM", // 设置大写数据库检索用户名
                PhoneNumber = "88888888", // 设置初始电话号码为 "88888888"
                gender_id = 1, // 关联默认性别 id 为 1 (Male)
                role = UserRole.Doctor, // 赋予当前用户核心业务角色为医生 Doctor
                status = true, // 初始正常开通此用户的使用状态为启用
                created_at = seedDate, // 使用静态设定入库生成日期
                updated_at = seedDate, // 使用静态设定入库最后修改日期
                SecurityStamp = "a18d9bc1-df8a-4412-bd7c-2ef3cfb1c19b", // 设置数据库专属防伪戳
                ConcurrencyStamp = "f42fbc1a-5c2c-48ca-9dbf-34fc4df22de7" // 设置并发冲突安全标记戳
            }; // 用户属性赋值块结束大括号
            userDoctor.PasswordHash = hasher.HashPassword(userDoctor, "Pin@776253"); // 采用哈希函数加密默认密码 "Pin@776253" 写入数据库密码列

            var userPatient = new User // 实例化第五个患者 patient 用户实体对象
            { // 用户属性赋值块开始大括号
                Id = 5, // 强行指定主键 id 为数值 5
                full_name = "patient", // 设置该患者的真实显示姓名为 "patient"
                Email = "patient@gmail.com", // 设定登录电子邮箱为 "patient@gmail.com"
                NormalizedEmail = "PATIENT@GMAIL.COM", // 设定大写后台校验邮箱
                UserName = "patient@gmail.com", // 设定登录账号用户名同邮箱一致
                NormalizedUserName = "PATIENT@GMAIL.COM", // 设定大写后台校验用户名
                PhoneNumber = "88888888", // 统一用户的初始电话号码为 "88888888"
                gender_id = 1, // 设置性别关联主键 id 为 1 (Male)
                role = UserRole.Patient, // 关联其在系统中的基础角色为患者 Patient
                status = true, // 设定初始用户的账号状态为正常激活启用
                created_at = seedDate, // 录入静态账号建立具体时间
                updated_at = seedDate, // 录入静态账号最后更新具体时间
                SecurityStamp = "94fcbc12-d61a-4c91-9cb6-1ef2cfc3a5de", // 生成其专用的安全标记保护戳
                ConcurrencyStamp = "e95abc2d-0f9c-4df6-8fb2-14ac7df38de4" // 生成用于控制修改冲突的并发戳
            }; // 用户属性赋值块结束大括号
            userPatient.PasswordHash = hasher.HashPassword(userPatient, "Pin@776253"); // 采用框架的标准加密处理密码并存储哈希密码字符串

            builder.Entity<User>().HasData(userPin, userSuperAdmin, userAdmin, userDoctor, userPatient); // 调用 EF Core 的 HasData 统一向物理 Users 数据表注册这五个默认初始种子用户
        } // OnModelCreating 方法体结束大括号
    } // AppDbContext 类定义结束大括号
} // 命名空间结束大括号