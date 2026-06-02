using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MedicalSystem.Data;
using MedicalSystem.Models;
using MedicalSystem.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.FileProviders; 
using System.IO;
using Serilog; // 1. 引入 Serilog 命名空间

// 2. 在应用启动最开始配置 Serilog
Log.Logger = new LoggerConfiguration()
    // 隐藏微软自带的大量冗余底层日志（可选，为了让 backend.log 更干净）
    .MinimumLevel.Warning() 
    .MinimumLevel.Override("MedicalSystem", Serilog.Events.LogEventLevel.Information)
    .WriteTo.File("backend.log", 
        shared: true, // 核心：开启共享模式，解决多线程/高并发下的文件写锁死问题
        rollingInterval: RollingInterval.Infinite, // 永远只写在这个 backend.log 文件里
        outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss}] {Message:lj}{NewLine}{Exception}") // 完全匹配你图中的日志格式
    .CreateLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // 3. 将 Serilog 挂载到 ASP.NET Core 框架中，接管全局日志系统
    builder.Host.UseSerilog();

    // 注册数据库上下文，使用 appsettings.json 中配置的 MySQL 连接字符串。
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

    // 注册 ASP.NET Core Identity，并使用项目自定义 of User 模型。
    builder.Services
        .AddIdentity<User, IdentityRole<int>>()
        .AddEntityFrameworkStores<AppDbContext>()
        .AddDefaultTokenProviders();

    // 配置 JWT 鉴权，同时支持前台 AccessToken 和后台 AuthToken 两套 Cookie。
    builder.Services
        .AddAuthentication(options =>
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
                ValidIssuer = builder.Configuration["Jwt:Issuer"],
                ValidAudience = builder.Configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
            };

            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    // 按接口路径优先选择对应 Cookie，避免前台患者 Cookie 被后台接口误用。
                    var path = context.Request.Path.Value ?? string.Empty;
                    var hasAccessToken = context.Request.Cookies.TryGetValue("AccessToken", out var accessToken);
                    var hasAuthToken = context.Request.Cookies.TryGetValue("AuthToken", out var authToken);

                    if (path.StartsWith("/api/auth", StringComparison.OrdinalIgnoreCase) && hasAccessToken)
                    {
                        context.Token = accessToken;
                    }
                    else if (path.StartsWith("/api/admin", StringComparison.OrdinalIgnoreCase) && hasAuthToken)
                    {
                        context.Token = authToken;
                    }
                    else if (hasAuthToken)
                    {
                        context.Token = authToken;
                    }
                    else if (hasAccessToken)
                    {
                        context.Token = accessToken;
                    }

                    return Task.CompletedTask;
                },
                OnTokenValidated = async context =>
                {
                    // Token 签名通过后，再检查用户是否存在且账号仍启用。
                    var userManager = context.HttpContext.RequestServices.GetRequiredService<UserManager<User>>();
                    var userId = context.Principal?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                        ?? context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                    if (string.IsNullOrWhiteSpace(userId))
                    {
                        context.Fail("Token 格式错误");
                        return;
                    }

                    var user = await userManager.FindByIdAsync(userId);
                    if (user == null || user.Status != 1)
                    {
                        context.Fail("该账号已无效");
                    }
                }
            };
        });

    // 注册控制器、Swagger 和业务服务。
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<IActivityLogService, ActivityLogService>();
    builder.Services.AddScoped<ITokenService, TokenService>();

    // 允许前端开发服务器携带 Cookie 调用 API。
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("FrontendCors", policy =>
        {
            policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
    });

    var app = builder.Build();

    // 开发环境启用 Swagger，方便调试接口。
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseCors("FrontendCors");
    app.UseAuthentication();
    app.UseAuthorization();

    // 核心修改点：配置并注册静态文件服务，允许直接访问 user-image 文件夹内的照片，并确保启动时自动创建
    var userImagePath = Path.Combine(Directory.GetCurrentDirectory(), "user-image");
    if (!Directory.Exists(userImagePath))
    {
        Directory.CreateDirectory(userImagePath);
    }
    app.UseStaticFiles(); // 支持 wwwroot
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(userImagePath),
        RequestPath = "/user-image"
    });

    app.MapControllers();
    app.Run();
}
catch (Exception ex)
{
    // 捕获应用启动期间崩溃的致命错误
    Log.Fatal(ex, "Host terminated unexpectedly");
}
finally
{
    // 4. 确保在应用关闭时，把缓冲在内存里的最后一点日志写入 backend.log
    Log.CloseAndFlush();
}