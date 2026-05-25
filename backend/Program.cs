using Microsoft.EntityFrameworkCore; 
using MedicalSystem.Data; 
using MedicalSystem.Models; 
using Microsoft.AspNetCore.Identity; 
using Microsoft.AspNetCore.Authentication.JwtBearer; 
using Microsoft.IdentityModel.Tokens; 
using System.Text; 
using System.IdentityModel.Tokens.Jwt; 
using System.Security.Claims; 
using Serilog; 

Log.Logger = new LoggerConfiguration() 
    .MinimumLevel.Information() 
    .Enrich.FromLogContext() 
    .WriteTo.Console() 
    .WriteTo.File( 
        "logs/backend.log", 
        rollingInterval: RollingInterval.Infinite, 
        shared: true, 
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}" 
    ) 
    .CreateLogger(); 

try 
{
    var builder = WebApplication.CreateBuilder(args); 

    builder.Services.AddHttpContextAccessor(); 
    builder.Services.AddScoped<MedicalSystem.Services.IActivityLogService, MedicalSystem.Services.ActivityLogService>(); 

    builder.Host.UseSerilog(); 

    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection"); 

    builder.Services.AddDbContext<AppDbContext>(options => 
        options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)) 
    ); 

    builder.Services.AddCors(options => 
    { 
        options.AddPolicy("AllowNextJS", policy => 
        { 
            // 必须明确指定前端地址（不能用 *）
            policy.WithOrigins("http://localhost:3000") 
                  .AllowAnyHeader() 
                  .AllowAnyMethod()
                  // 【核心修复】：必须加上这一行，告诉浏览器后端允许接收跨域 Cookie！
                  .AllowCredentials(); 
        }); 
    });

    builder.Services.AddIdentity<User, IdentityRole<int>>(options => { 
        options.Password.RequireDigit = false; 
        options.Password.RequiredLength = 6; 
        options.Password.RequireNonAlphanumeric = false; 
        options.Password.RequireUppercase = false; 
        options.Password.RequireLowercase = false; 
    }) 
    .AddEntityFrameworkStores<AppDbContext>() 
    .AddDefaultTokenProviders(); 

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

        options.Events = new JwtBearerEvents 
        { 
            // ==========================================
            // 【核心新增】：告诉系统自动去 Cookie 里面拿 Token
            // ==========================================
            OnMessageReceived = context => 
            {
                if (context.Request.Cookies.ContainsKey("AuthToken"))
                {
                    context.Token = context.Request.Cookies["AuthToken"];
                }
                return Task.CompletedTask;
            },
            OnTokenValidated = async context => 
            { 
                var userManager = context.HttpContext.RequestServices.GetRequiredService<UserManager<User>>(); 
                
                var userId = context.Principal?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value 
                          ?? context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value; 

                if (string.IsNullOrEmpty(userId)) 
                { 
                    context.Fail("Token 格式错误，找不到用户标识。"); 
                    return; 
                } 

                var user = await userManager.FindByIdAsync(userId); 

                if (user == null || user.status != true) 
                { 
                    context.Fail("该账号已从数据库中删除或被禁用。"); 
                } 
            } 
        }; 
    }); 

    builder.Services.AddControllers(); 
    builder.Services.AddEndpointsApiExplorer(); 
    builder.Services.AddSwaggerGen(); 

    var app = builder.Build(); 

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
                await db.Database.ExecuteSqlRawAsync("DELETE FROM `" + name + "`;"); 
                await db.Database.ExecuteSqlRawAsync("ALTER TABLE `" + name + "` AUTO_INCREMENT = 1;"); 
            } 
            await db.Database.ExecuteSqlInterpolatedAsync($"SET FOREIGN_KEY_CHECKS = 1;"); 
        } 
        return; 
    } 

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

    Log.Information("Backend web service is starting up correctly..."); 
    app.Run(); 
} 
catch (Exception ex) when (ex.GetType().Name != "HostAbortedException") 
{ 
    Log.Fatal(ex, "The application terminated unexpectedly because of a startup error."); 
    throw; 
} 
finally 
{ 
    Log.CloseAndFlush(); 
}