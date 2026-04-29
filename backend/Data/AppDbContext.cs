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
        public DbSet<Department> Departments { get; set; } = null!;

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

            // ==========================================
            // 新增：初始化 Department (科室) 种子数据
            // ==========================================
            builder.Entity<Department>().HasData(
                new Department { Id = 1, Name = "Emergency Department (ER)", Location = "Block A, Level 1", IsActive = true },
                new Department { Id = 2, Name = "Cardiology", Location = "Block B, Level 3", IsActive = true },
                new Department { Id = 3, Name = "Neurology", Location = "Block B, Level 4", IsActive = true },
                new Department { Id = 4, Name = "Pediatrics", Location = "Block C, Level 2", IsActive = true },
                new Department { Id = 5, Name = "Oncology", Location = "Block D, Level 1", IsActive = true },
                new Department { Id = 6, Name = "Orthopedics", Location = "Block A, Level 2", IsActive = true },
                new Department { Id = 7, Name = "General Surgery", Location = "Block A, Level 3", IsActive = true },
                new Department { Id = 8, Name = "Intensive Care Unit (ICU)", Location = "Block A, Level 4", IsActive = true },
                new Department { Id = 9, Name = "Radiology & Imaging", Location = "Block C, Basement 1", IsActive = true },
                new Department { Id = 10, Name = "Pharmacy", Location = "Block A, Level 1", IsActive = true },
                new Department { Id = 11, Name = "Obstetrics and Gynecology", Location = "Block C, Level 3", IsActive = true },
                new Department { Id = 12, Name = "Dental Clinic", Location = "Block B, Level 1", IsActive = false } 
            );
        }
    }
}