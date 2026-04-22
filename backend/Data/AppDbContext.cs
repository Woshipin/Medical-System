using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MedicalSystem.Models;

namespace MedicalSystem.Data
{
    // 继承 IdentityDbContext 并指定我们自定义的 User 类
    public class AppDbContext : IdentityDbContext<User>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Doctor> Doctors { get; set; } = null!;
        public DbSet<Gender> Genders { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder builder)
        {
            // 必须首先调用基类方法，以加载 Identity 默认配置
            base.OnModelCreating(builder);

            // ============================================================
            // 1. 重命名 Identity 默认表名（让数据库看起来更专业、直观）
            // ============================================================
            builder.Entity<User>().ToTable("Users"); // 修改 aspnetusers -> Users
            builder.Entity<IdentityRole>().ToTable("Roles"); // 修改 aspnetroles -> Roles
            builder.Entity<IdentityUserRole<string>>().ToTable("UserRoles");
            builder.Entity<IdentityUserClaim<string>>().ToTable("UserClaims");
            builder.Entity<IdentityUserLogin<string>>().ToTable("UserLogins");
            builder.Entity<IdentityRoleClaim<string>>().ToTable("RoleClaims");
            builder.Entity<IdentityUserToken<string>>().ToTable("UserTokens");

            // ============================================================
            // 2. 配置 User 与 Doctor 的 [1对1] 强关联
            // ============================================================
            builder.Entity<User>()
                .HasOne(u => u.DoctorProfile)
                .WithOne(d => d.User)
                .HasForeignKey<Doctor>(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade); // 账号删除，档案随之删除

            // ============================================================
            // 3. 字段属性细化配置 (Validation)
            // ============================================================
            // 确保角色在数据库中以整数形式存储（性能最高）
            builder.Entity<User>()
                .Property(u => u.Role)
                .IsRequired();

            // ============================================================
            // 4. 初始化种子数据 (Seeding)
            // ============================================================
            builder.Entity<Gender>().HasData(
                new Gender { Id = 1, Name = "男", IsActive = true },
                new Gender { Id = 2, Name = "女", IsActive = true },
                new Gender { Id = 3, Name = "其他", IsActive = true }
            );
        }
    }
}