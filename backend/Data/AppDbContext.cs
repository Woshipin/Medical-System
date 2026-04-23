using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MedicalSystem.Models;

namespace MedicalSystem.Data
{
    public class AppDbContext : IdentityDbContext<User, IdentityRole<int>, int>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Doctor> Doctors { get; set; } = null!;
        public DbSet<Gender> Genders { get; set; } = null!;

        // 自动更新时间戳逻辑
        public override Task<int> SaveChangesAsync(CancellationToken ct = default)
        {
            var entries = ChangeTracker.Entries<User>()
                .Where(e => e.State == EntityState.Modified);

            foreach (var entry in entries)
            {
                entry.Entity.UpdatedAt = DateTime.Now;
            }
            return base.SaveChangesAsync(ct);
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // 配置 Users 表及其列名映射
            builder.Entity<User>(entity =>
            {
                entity.ToTable("Users");
                // 强制将内置 Email 字段在数据库中显示为 Email (首字母大写)
                entity.Property(u => u.Email).HasColumnName("Email");
                // 确保 PasswordHash 等字段依然存在但不影响你要求的 Header 显示
            });

            // 简化其他 Identity 表名
            builder.Entity<IdentityRole<int>>().ToTable("Roles");
            builder.Entity<IdentityUserRole<int>>().ToTable("UserRoles");
            builder.Entity<IdentityUserClaim<int>>().ToTable("UserClaims");
            builder.Entity<IdentityUserLogin<int>>().ToTable("UserLogins");
            builder.Entity<IdentityRoleClaim<int>>().ToTable("RoleClaims");
            builder.Entity<IdentityUserToken<int>>().ToTable("UserTokens");

            // 初始化种子数据
            builder.Entity<Gender>().HasData(
                new Gender { Id = 1, Name = "Male", IsActive = true },
                new Gender { Id = 2, Name = "Female", IsActive = true }
            );
        }
    }
}