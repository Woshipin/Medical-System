using Microsoft.EntityFrameworkCore;
using MedicalSystem.Data;
using MedicalSystem.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args); 

// 1. 获取数据库连接字符串
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// 2. 注册数据库上下文 (MySQL)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString))
);

// 3. 配置 CORS：允许 Next.js 前端 (localhost:3000) 进行跨域访问
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJS", policy =>
    {
        policy.WithOrigins("http://localhost:3000") // 允许前端地址
              .AllowAnyHeader()                   // 允许任何请求头
              .AllowAnyMethod();                  // 允许任何方法 (GET, POST等)
    });
});

// 4. 注册 Identity 身份认证系统
builder.Services.AddIdentity<User, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// 5. 配置 JWT 认证（必须与 appsettings.json 中的设置一致）
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,                // 验证签发者
        ValidateAudience = true,              // 验证接收者
        ValidateLifetime = true,              // 验证过期时间
        ValidateIssuerSigningKey = true,      // 验证密钥
        ValidIssuer = jwtSettings["Issuer"],  // 对应的签发者
        ValidAudience = jwtSettings["Audience"], // 对应的接收者
        IssuerSigningKey = new SymmetricSecurityKey(key) // 设置密钥
    };
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 6. 处理数据重置逻辑 (--reset-data)
if (args.Contains("--reset-data"))
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.ExecuteSqlInterpolatedAsync($"SET FOREIGN_KEY_CHECKS = 0;");
        var tableNames = db.Model.GetEntityTypes().Select(t => t.GetTableName()).Distinct();
        foreach (var name in tableNames)
        {
            if (name == null) continue;
            await db.Database.ExecuteSqlRawAsync($"DELETE FROM `{name}`;");
            await db.Database.ExecuteSqlRawAsync($"ALTER TABLE `{name}` AUTO_INCREMENT = 1;");
        }
        await db.Database.ExecuteSqlInterpolatedAsync($"SET FOREIGN_KEY_CHECKS = 1;");
    }
    return;
}

// 7. 配置 HTTP 请求管道
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// --- 注意：中间件的顺序非常重要 ---

// 启用跨域策略 (必须在 Authentication 之前)
app.UseCors("AllowNextJS");

app.UseHttpsRedirection();

// 启用身份验证 (识别 Token)
app.UseAuthentication(); 

// 启用权限管理
app.UseAuthorization();

app.MapControllers();

app.Run();