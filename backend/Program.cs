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
        policy.WithOrigins("http://localhost:3000") 
              .AllowAnyHeader()                   
              .AllowAnyMethod();                  
    });
});

// 4. 注册 Identity 身份认证系统
// 【关键修改】：显式指定 IdentityRole 使用 int 类型主键
builder.Services.AddIdentity<User, IdentityRole<int>>(options => {
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// 5. 配置 JWT 认证
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
        ValidateIssuer = true,                
        ValidateAudience = true,              
        ValidateLifetime = true,              
        ValidateIssuerSigningKey = true,      
        ValidIssuer = jwtSettings["Issuer"],  
        ValidAudience = jwtSettings["Audience"], 
        IssuerSigningKey = new SymmetricSecurityKey(key) 
    };
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 6. 处理数据重置逻辑
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

app.UseCors("AllowNextJS");
app.UseHttpsRedirection();
app.UseAuthentication(); 
app.UseAuthorization();
app.MapControllers();
app.Run();