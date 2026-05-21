using Microsoft.EntityFrameworkCore; // 引入 Entity Framework Core 命名空间，提供数据库操作支持
using MedicalSystem.Data; // 引入本项目的数据上下文命名空间，用于访问 AppDbContext
using MedicalSystem.Models; // 引入本项目的实体模型命名空间，用于访问 User 等实体类
using Microsoft.AspNetCore.Identity; // 引入 ASP.NET Core Identity 命名空间，提供用户及角色管理
using Microsoft.AspNetCore.Authentication.JwtBearer; // 引入 JWT 身份验证机制，处理 Token 认证组件
using Microsoft.IdentityModel.Tokens; // 引入安全令牌验证库，配置签名密钥等参数
using System.Text; // 引入文本编码命名空间，用于密钥的字符编码转换
using System.IdentityModel.Tokens.Jwt; // 引入 JWT 核心生成和解析处理器命名空间
using System.Security.Claims; // 引入声明实体命名空间，用于解析 Token 中携带的用户标识
using Serilog; // 【新增】引入 Serilog 第三方日志框架命名空间，实现更高效的日志记录

// ==========================================
// 【新增】配置全局 Serilog 日志记录器
// ==========================================
Log.Logger = new LoggerConfiguration() // 初始化日志配置类实例
    .MinimumLevel.Information() // 设置系统记录的全局最低日志级别为 Information（信息级）
    .Enrich.FromLogContext() // 启用从日志上下文自动捕获并填充额外属性的功能
    .WriteTo.Console() // 配置同时将日志实时输出到开发终端控制台窗口
    .WriteTo.File( // 配置将日志输出到本地物理日志文件中
        "logs/backend.log", // 设置日志存储路径为项目根目录下的 logs/backend.log
        rollingInterval: RollingInterval.Infinite, // 设定日志不按时间拆分，全部合并写入这单个文件
        shared: true, // 允许其他辅助程序（如文本编辑器）在程序运行时安全读取此文件
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}" // 设定日志输出的内容排版格式模版
    ) // 结束文件配置
    .CreateLogger(); // 最终实例化构建日志记录器对象

try // 包裹整体启动生命周期，以便完整捕获可能导致应用崩溃的致命异常
{
    var builder = WebApplication.CreateBuilder(args); // 创建 Web 应用程序的主机生成器实例

    // 注册 HTTP 上下文访问器（实现自动抓取 IP 和用户 Claims 的关键）
    builder.Services.AddHttpContextAccessor(); // 【新增】

    // 注册我们自定义的日志服务
    builder.Services.AddScoped<MedicalSystem.Services.IActivityLogService, MedicalSystem.Services.ActivityLogService>(); // 【新增】

    // ==========================================
    // 【新增】注入并接管宿主日志系统
    // ==========================================
    builder.Host.UseSerilog(); // 指示系统使用 Serilog 替换自带日志引擎，将所有内部输出（包括 EF Core、SQL 等）合并写入同一文件

    // 1. 获取数据库连接字符串
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection"); // 从 appsettings.json 中读取键名为 DefaultConnection 的连接字符串

    // 2. 注册数据库上下文 (MySQL)
    builder.Services.AddDbContext<AppDbContext>(options => // 向依赖注入容器中配置 AppDbContext 数据库服务
        options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)) // 指定使用 MySQL 数据库，并自动检测数据库服务器的版本
    ); // 结束服务配置

    // 3. 配置 CORS：允许 Next.js 前端 (localhost:3000) 进行跨域访问
    builder.Services.AddCors(options => // 注册跨域资源共享（CORS）策略
    { // 开始配置 CORS 选项
        options.AddPolicy("AllowNextJS", policy => // 定义一个名为 AllowNextJS 的跨域访问安全策略
        { // 开始具体策略细则配置
            policy.WithOrigins("http://localhost:3000") // 允许来源为 Next.js 默认运行端口 http://localhost:3000 的请求
                  .AllowAnyHeader() // 允许跨域请求中携带任意格式的 HTTP 请求头
                  .AllowAnyMethod(); // 允许跨域请求使用任意的 HTTP 请求方法（GET/POST/PUT/DELETE 等）
        }); // 结束策略配置
    }); // 结束 CORS 注册

    // 4. 注册 Identity 身份认证系统
    builder.Services.AddIdentity<User, IdentityRole<int>>(options => { // 配置系统的身份认证和账号管理机制，主键采用整型
        options.Password.RequireDigit = false; // 降低安全策略：要求密码中无需强制包含数字字符
        options.Password.RequiredLength = 6; // 降低安全策略：设定密码的最小字符长度要求限制为 6
        options.Password.RequireNonAlphanumeric = false; // 降低安全策略：要求密码中无需包含非字母数字的特殊符号
        options.Password.RequireUppercase = false; // 降低安全策略：要求密码中无需强制包含大写字母
        options.Password.RequireLowercase = false; // 降低安全策略：要求密码中无需强制包含小写字母
    }) // 结束参数设定
    .AddEntityFrameworkStores<AppDbContext>() // 配置将 Identity 相关的用户信息直接持久化存入配置的 AppDbContext 数据库
    .AddDefaultTokenProviders(); // 注册默认安全令牌提供者，用于后续重置密码、邮箱确认等场景

    // 5. 配置 JWT 认证
    var jwtSettings = builder.Configuration.GetSection("Jwt"); // 获取 appsettings.json 配置文件中 Jwt 的配置节点对象
    var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!); // 将 JWT 密钥配置值按照 UTF-8 编码读取并转换成安全密钥字节数组

    builder.Services.AddAuthentication(options => // 配置系统默认认证机制服务
    { // 配置选项细节
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme; // 指定默认通过 JWT Bearer 机制来识别并鉴别用户的身份
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme; // 指定未登录或失效时，使用默认 Bearer 返回未授权质询
    }) // 结束最外层鉴权配置
    .AddJwtBearer(options => // 注册 JWT Bearer 参数校验拦截器
    { // 配置 JWT 具体校验规则
        options.TokenValidationParameters = new TokenValidationParameters // 声明并实例化 Token 的安全校验参数类
        { // 设定各项校验因子
            ValidateIssuer = true, // 开启验证 Token 发行者
            ValidateAudience = true, // 开启验证 Token 接收受众
            ValidateLifetime = true, // 开启验证 Token 的有效期，过期后立刻失效
            ValidateIssuerSigningKey = true, // 开启验证 Token 尾部数字签名的合法性，防篡改
            ValidIssuer = jwtSettings["Issuer"], // 绑定合法的发行者匹配值为配置文件中指定的值
            ValidAudience = jwtSettings["Audience"], // 绑定合法的接收者匹配值为配置文件中指定的值
            IssuerSigningKey = new SymmetricSecurityKey(key) // 设置解密和生成电子签名所必须使用的对称安全密钥
        }; // 结束参数对象声明

        // 强制查库拦截器
        options.Events = new JwtBearerEvents // 实例化 JWT 鉴权各周期的事件拦截器类
        { // 注册 Token 校验通过后的二次干预逻辑
            OnTokenValidated = async context => // 注册 Token 签名、有效期等基础校验完全通过后的自定义回调异步事件
            { // 开始业务查库二次确认逻辑
                var userManager = context.HttpContext.RequestServices.GetRequiredService<UserManager<User>>(); // 从当前的请求生命周期中动态提取出 UserManager 用户管理器
                
                // 提取 UserID
                var userId = context.Principal?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value // 尝试获取 Token 声明荷载中标准的 Sub 主键标识对应的值
                          ?? context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value; // 如果没有 Sub，则降级寻找默认的 NameIdentifier 主键标识值

                if (string.IsNullOrEmpty(userId)) // 判断如果 Token 内没有携带任何合法的主键 ID 标识
                { // 处理异常
                    context.Fail("Token 格式错误，找不到用户标识。"); // 调用事件失败方法，提前强制使当前 HTTP 请求的身份认证失败
                    return; // 结束执行当前事件
                } // 结束校验

                // 去数据库查人
                var user = await userManager.FindByIdAsync(userId); // 拿着解析出来的 ID 直接去物理数据库中查找是否存在该用户账号

                // 如果数据库里查不到，或者人被禁用了，直接毙掉 Token
                if (user == null || !user.IsActive) // 判断如果数据库中该账号已被删除或当前 IsActive 标志为 false（未激活/已禁用）
                { // 处理阻断
                    context.Fail("该账号已从数据库中删除或被禁用。"); // 调用失败回调，废止并作废当前携带的合法 Token
                } // 结束判断
            } // 结束事件编写
        }; // 结束事件注入
    }); // 结束 JWT 模块配置

    builder.Services.AddControllers(); // 注册核心控制器映射与实例化服务
    builder.Services.AddEndpointsApiExplorer(); // 注册微服务和终端节点探测服务，用于发现 API 路径
    builder.Services.AddSwaggerGen(); // 注册 Swagger 接口文档渲染引擎生成器

    var app = builder.Build(); // 构建并生成最终的 WebApplication 管道实例对象

    // 6. 处理数据重置逻辑
    if (args.Contains("--reset-data")) // 检查启动命令行参数中是否包含清除和重置数据库指令 `--reset-data`
    { // 执行数据清空逻辑
        using (var scope = app.Services.CreateScope()) // 创建独立局部的服务作用范围生命周期以解析数据库连接
        { // 启动生命周期块
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>(); // 从范围容器中动态解析并提取当前 AppDbContext
            await db.Database.ExecuteSqlInterpolatedAsync($"SET FOREIGN_KEY_CHECKS = 0;"); // 异步在 MySQL 中执行指令，临时关闭表与表之间的外键完整性约束
            var tableNames = db.Model.GetEntityTypes().Select(t => t.GetTableName()).Distinct(); // 扫描 EF Core 当前物理模型映射出的全部数据表名称集合
            foreach (var name in tableNames) // 循环遍历数据表名称
            { // 开始单表清除
                if (name == null) continue; // 如果解析出的表名为空，跳过本次循环
                await db.Database.ExecuteSqlRawAsync($"DELETE FROM `{name}`;"); // 异步向数据库发送指令，彻底清除表内已有数据
                await db.Database.ExecuteSqlRawAsync($"ALTER TABLE `{name}` AUTO_INCREMENT = 1;"); // 异步重置该数据表的自动递增主键计数器恢复至初始 1
            } // 结束清除
            await db.Database.ExecuteSqlInterpolatedAsync($"SET FOREIGN_KEY_CHECKS = 1;"); // 异步向 MySQL 发送指令，恢复并开启数据库外键约束验证
        } // 退出并销毁创建的服务作用范围
        return; // 执行完数据清除和初始化脚本后，立刻中止程序并返回，不继续暴露运行后端监听
    } // 结束重置逻辑

    // 7. 配置 HTTP 请求管道
    if (app.Environment.IsDevelopment()) // 检测当前运行环境是否为本地开发环境 (Development)
    { // 启用开发者辅助界面
        app.UseSwagger(); // 启动并提供对外开放的 swagger.json 文档数据描述节点
        app.UseSwaggerUI(); // 开启 Swagger 的美化交互网页界面，方便接口调试与阅读
    } // 结束开发环境专属中间件判断

    app.UseCors("AllowNextJS"); // 向中间件管道注入 CORS，应用名为 AllowNextJS 的规则以支持 Next.js 跨域访问
    app.UseHttpsRedirection(); // 注入 HTTPS 重定向，自动将发送到 HTTP 端口的请求重新安全引导指向 HTTPS
    app.UseAuthentication(); // 注入身份验证中间件，通过携带的 Bearer Token 解析并建立当前用户的凭证身份
    app.UseAuthorization(); // 注入授权检查中间件，核对通过后是否允许进入目标控制器的对应方法
    app.MapControllers(); // 将控制器内标记了路由属性的 Action 终结点注册到路由匹配树上

    Log.Information("Backend web service is starting up correctly..."); // 【新增】向控制台与本地文件记录服务启动日志
    app.Run(); // 启动后端 HTTP 侦听端口，开始正式等待并处理外界请求
} // try 块结束
// ==========================================
// 修改后的 catch 块（增加了 when 过滤条件）
// ==========================================
catch (Exception ex) when (ex.GetType().Name != "HostAbortedException") // 过滤掉 EF Core 命令行工具主动中止主机的正常异常
{ 
    Log.Fatal(ex, "The application terminated unexpectedly because of a startup error."); // 仅在发生真正的启动崩溃时才记录致命错误
    throw; // 重新抛出真实异常
} // catch 块结束
finally // 无论系统正常结束还是崩溃，最后都必须保障运行的资源回收区
{ // 收尾处理
    Log.CloseAndFlush(); // 【新增】在应用程序彻底注销关闭前，强制将缓冲区内的最后所有残留日志全部无损刷盘入 backend.log 文件
} // finally 块结束