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
using Microsoft.Extensions.FileProviders; // 引入文件提供器命名空间
using System.IO;

var builder = WebApplication.CreateBuilder(args);

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