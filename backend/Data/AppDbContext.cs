using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MedicalSystem.Models;
using System;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;

namespace MedicalSystem.Data
{
    public class AppDbContext : IdentityDbContext<User, IdentityRole<int>, int>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Doctor> Doctors { get; set; } = null!;
        public DbSet<Gender> Genders { get; set; } = null!;
        public DbSet<Department> Departments { get; set; } = null!;
        public DbSet<ActivityLog> ActivityLogs { get; set; } = null!;
        public DbSet<Specialty> Specialties { get; set; } = null!;
        public DbSet<Position> Positions { get; set; } = null!;
        public DbSet<OfficeLocation> OfficeLocations { get; set; } = null!;
        public DbSet<Service> Services { get; set; } = null!;
        public DbSet<DoctorLeave> DoctorLeaves { get; set; } = null!;

        // ✅ [修改1] 新增 DoctorSchedules DbSet（这是导致所有 6 个 error 的根本原因）
        public DbSet<DoctorSchedule> DoctorSchedules { get; set; } = null!;

        public DbSet<UserRefreshToken> UserRefreshTokens { get; set; } = null!;
        public DbSet<PatientProfile> PatientProfiles { get; set; } = null!;

        public override Task<int> SaveChangesAsync(CancellationToken ct = default)
        {
            var entries = ChangeTracker.Entries<User>()
                .Where(e => e.State == EntityState.Modified);

            foreach (var entry in entries)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
            return base.SaveChangesAsync(ct);
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<User>(entity =>
            {
                entity.ToTable("Users");
                entity.Property(u => u.Id).HasColumnName("id").HasColumnOrder(1);
                entity.Property(u => u.FullName).HasColumnName("full_name").HasColumnOrder(2);
                entity.Property(u => u.Email).HasColumnName("email").HasColumnOrder(3);
                entity.Property(u => u.PasswordHash).HasColumnName("password").HasColumnOrder(4);
                entity.Property(u => u.ProfileImageUrl).HasColumnName("profile_image_url").HasColumnOrder(5);
                entity.Property(u => u.PhoneNumber).HasColumnName("phone_number").HasColumnOrder(6);
                entity.Property(u => u.PhoneNumberAlt).HasColumnName("phone_number_alt").HasColumnOrder(7);
                entity.Property(u => u.GenderId).HasColumnName("gender_id").HasColumnOrder(8);
                entity.Property(u => u.Role).HasColumnName("role").HasColumnOrder(9);
                entity.Property(u => u.Status).HasColumnName("status").HasColumnOrder(10);
                entity.Property(u => u.DateOfBirth).HasColumnName("date_of_birth").HasColumnOrder(11);
                entity.Property(u => u.AddressLine1).HasColumnName("address_line_1").HasColumnOrder(12);
                entity.Property(u => u.AddressLine2).HasColumnName("address_line_2").HasColumnOrder(13);
                entity.Property(u => u.City).HasColumnName("city").HasColumnOrder(14);
                entity.Property(u => u.State).HasColumnName("state").HasColumnOrder(15);
                entity.Property(u => u.PostalCode).HasColumnName("postal_code").HasColumnOrder(16);
                entity.Property(u => u.Country).HasColumnName("country").HasColumnOrder(17);
                entity.Property(u => u.CreatedAt).HasColumnName("created_at").HasColumnOrder(18);
                entity.Property(u => u.UpdatedAt).HasColumnName("updated_at").HasColumnOrder(19);
                entity.Property(u => u.NormalizedEmail).HasColumnOrder(20);
                entity.Property(u => u.UserName).HasColumnOrder(21);
                entity.Property(u => u.NormalizedUserName).HasColumnOrder(22);
                entity.Property(u => u.EmailConfirmed).HasColumnOrder(23);
                entity.Property(u => u.SecurityStamp).HasColumnOrder(24);
                entity.Property(u => u.ConcurrencyStamp).HasColumnOrder(25);
                entity.Property(u => u.PhoneNumberConfirmed).HasColumnOrder(26);
                entity.Property(u => u.TwoFactorEnabled).HasColumnOrder(27);
                entity.Property(u => u.LockoutEnd).HasColumnOrder(28);
                entity.Property(u => u.LockoutEnabled).HasColumnOrder(29);
                entity.Property(u => u.AccessFailedCount).HasColumnOrder(30);
            });

            builder.Entity<UserRefreshToken>(entity =>
            {
                entity.HasIndex(rt => rt.Token).IsUnique();
            });

            // ✅ [修改2] 为 DoctorLeave.ApprovedBy → User 关系配置 SetNull，避免 cascade delete 冲突
            builder.Entity<DoctorLeave>(entity =>
            {
                entity.HasOne(d => d.Approver)
                      .WithMany()
                      .HasForeignKey(d => d.ApprovedBy)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // ✅ [修改3] 为 DoctorSchedule 添加唯一约束：同一医生同一天只能有一条 active schedule
            builder.Entity<DoctorSchedule>(entity =>
            {
                entity.HasIndex(s => new { s.DoctorId, s.DayOfWeek })
                      .HasFilter("is_active = 1")
                      .IsUnique();
            });

            builder.Entity<IdentityRole<int>>().ToTable("Roles");
            builder.Entity<IdentityUserRole<int>>().ToTable("UserRoles");
            builder.Entity<IdentityUserClaim<int>>().ToTable("UserClaims");
            builder.Entity<IdentityUserLogin<int>>().ToTable("UserLogins");
            builder.Entity<IdentityRoleClaim<int>>().ToTable("RoleClaims");
            builder.Entity<IdentityUserToken<int>>().ToTable("UserTokens");

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

            var hasher = new PasswordHasher<User>();
            var seedDate = new DateTime(2026, 5, 25, 0, 0, 0, DateTimeKind.Utc);

            builder.Entity<Specialty>().HasData(
                new Specialty { id = 1, name = "General Cardiology", status = 1, created_at = seedDate, updated_at = seedDate },
                new Specialty { id = 2, name = "Clinical Neurology", status = 1, created_at = seedDate, updated_at = seedDate },
                new Specialty { id = 3, name = "Pediatrics Care", status = 1, created_at = seedDate, updated_at = seedDate }
            );

            builder.Entity<Position>().HasData(
                new Position { id = 1, name = "Chief Physician", status = 1, created_at = seedDate, updated_at = seedDate },
                new Position { id = 2, name = "Associate Chief Physician", status = 1, created_at = seedDate, updated_at = seedDate },
                new Position { id = 3, name = "Attending Physician", status = 1, created_at = seedDate, updated_at = seedDate }
            );

            builder.Entity<OfficeLocation>().HasData(
                new OfficeLocation { id = 1, name = "Consultation Room 101 (Block A, Level 1)", status = 1, created_at = seedDate, updated_at = seedDate },
                new OfficeLocation { id = 2, name = "Consultation Room 302 (Block B, Level 3)", status = 1, created_at = seedDate, updated_at = seedDate }
            );

            builder.Entity<Service>().HasData(
                new Service { id = 1, name = "General Consultation (全科门诊)", status = 1 },
                new Service { id = 2, name = "Cardiology (心脏专科)", status = 1 },
                new Service { id = 3, name = "Dental Care (牙科门诊)", status = 1 },
                new Service { id = 4, name = "Pediatrics (儿科门诊)", status = 1 },
                new Service { id = 5, name = "Neurology (神经内科)", status = 0 },
                new Service { id = 6, name = "Physiotherapy (康复理疗)", status = 1 }
            );

            var userPin = new User
            {
                Id = 1, FullName = "pin", Email = "pin@gmail.com",
                NormalizedEmail = "PIN@GMAIL.COM", UserName = "pin@gmail.com",
                NormalizedUserName = "PIN@GMAIL.COM", PhoneNumber = "88888888",
                GenderId = 1, Role = UserRole.Patient, Status = 1,
                CreatedAt = seedDate, UpdatedAt = seedDate,
                SecurityStamp = "f4c9c7d1-e6df-46b0-9b62-fa583db13d5a",
                ConcurrencyStamp = "a72b83c1-0c5a-4e67-8fa6-fb2a6cf124de"
            };
            userPin.PasswordHash = hasher.HashPassword(userPin, "Pin@776253");

            var userSuperAdmin = new User
            {
                Id = 2, FullName = "superadmin", Email = "superadmin@gmail.com",
                NormalizedEmail = "SUPERADMIN@GMAIL.COM", UserName = "superadmin@gmail.com",
                NormalizedUserName = "SUPERADMIN@GMAIL.COM", PhoneNumber = "88888888",
                GenderId = 1, Role = UserRole.SuperAdmin, Status = 1,
                CreatedAt = seedDate, UpdatedAt = seedDate,
                SecurityStamp = "c95e1e0a-bf6b-4df2-823a-fcf723fbfa4b",
                ConcurrencyStamp = "b84f93c1-cd2c-47ea-bcbf-11fc2cf00de8"
            };
            userSuperAdmin.PasswordHash = hasher.HashPassword(userSuperAdmin, "Pin@776253");

            var userAdmin = new User
            {
                Id = 3, FullName = "admin", Email = "admin@gmail.com",
                NormalizedEmail = "ADMIN@GMAIL.COM", UserName = "admin@gmail.com",
                NormalizedUserName = "ADMIN@GMAIL.COM", PhoneNumber = "88888888",
                GenderId = 1, Role = UserRole.Admin, Status = 1,
                CreatedAt = seedDate, UpdatedAt = seedDate,
                SecurityStamp = "e74c83fa-da13-4cb2-83b6-9df2cfd1e3ca",
                ConcurrencyStamp = "d85fbc2a-1c3c-41ca-a2bf-23fc3df11de9"
            };
            userAdmin.PasswordHash = hasher.HashPassword(userAdmin, "Pin@776253");

            var userDoctor = new User
            {
                Id = 4, FullName = "doctor", Email = "doctor@gmail.com",
                NormalizedEmail = "DOCTOR@GMAIL.COM", UserName = "doctor@gmail.com",
                NormalizedUserName = "DOCTOR@GMAIL.COM", PhoneNumber = "88888888",
                GenderId = 1, Role = UserRole.Doctor, Status = 1,
                CreatedAt = seedDate, UpdatedAt = seedDate,
                SecurityStamp = "a18d9bc1-df8a-4412-bd7c-2ef3cfb1c19b",
                ConcurrencyStamp = "f42fbc1a-5c2c-48ca-9dbf-34fc4df22de7"
            };
            userDoctor.PasswordHash = hasher.HashPassword(userDoctor, "Pin@776253");

            var userPatient = new User
            {
                Id = 5, FullName = "patient", Email = "patient@gmail.com",
                NormalizedEmail = "PATIENT@GMAIL.COM", UserName = "patient@gmail.com",
                NormalizedUserName = "PATIENT@GMAIL.COM", PhoneNumber = "88888888",
                GenderId = 1, Role = UserRole.Patient, Status = 1,
                CreatedAt = seedDate, UpdatedAt = seedDate,
                SecurityStamp = "94fcbc12-d61a-4c91-9cb6-1ef2cfc3a5de",
                ConcurrencyStamp = "e95abc2d-0f9c-4df6-8fb2-14ac7df38de4"
            };
            userPatient.PasswordHash = hasher.HashPassword(userPatient, "Pin@776253");

            var userAhpin = new User
            {
                Id = 6, FullName = "ahpin", Email = "ahpin7762@gmail.com",
                NormalizedEmail = "AHPIN7762@GMAIL.COM", UserName = "ahpin7762@gmail.com",
                NormalizedUserName = "AHPIN7762@GMAIL.COM", PhoneNumber = "88888888",
                GenderId = 1, Role = UserRole.SuperAdmin, Status = 1,
                CreatedAt = seedDate, UpdatedAt = seedDate,
                SecurityStamp = "782b3d2b-6c41-432d-948f-287d3a8fc4b1",
                ConcurrencyStamp = "e36e8b41-db4a-4a2a-b73a-44d5cf3011ca"
            };
            userAhpin.PasswordHash = hasher.HashPassword(userAhpin, "Pin@776253");

            builder.Entity<User>().HasData(userPin, userSuperAdmin, userAdmin, userDoctor, userPatient, userAhpin);

            builder.Entity<PatientProfile>().HasData(
                new PatientProfile { Id = 1, UserId = 1, CreatedAt = seedDate, UpdatedAt = seedDate },
                new PatientProfile { Id = 2, UserId = 5, CreatedAt = seedDate, UpdatedAt = seedDate }
            );

            builder.Entity<Doctor>().HasData(
                new Doctor { Id = 1, UserId = 4, Status = 0, CreatedAt = seedDate, UpdatedAt = seedDate }
            );
        }
    }
}