// Services/TokenService.cs
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using MedicalSystem.Data;
using MedicalSystem.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace MedicalSystem.Services
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;

        public TokenService(IConfiguration configuration, AppDbContext context)
        {
            _configuration = configuration;
            _context = context;
        }

        // 生成短寿命的 Access Token (JWT)
        public string GenerateAccessToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var claims = new[] {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            };

            // 设置为较短的过期时间，例如 15 分钟
            var token = new JwtSecurityToken(
                _configuration["Jwt:Issuer"],
                _configuration["Jwt:Audience"],
                claims,
                expires: DateTime.UtcNow.AddMinutes(15), 
                signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // 生成长寿命的 Refresh Token 并持久化到数据库
        public async Task<string> GenerateRefreshTokenAsync(int userId)
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            var tokenString = Convert.ToBase64String(randomNumber);

            // 设置长寿命，例如 7 天
            var refreshToken = new UserRefreshToken
            {
                UserId = userId,
                Token = tokenString,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                IsRevoked = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.UserRefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            return tokenString;
        }

        // 将双 Token 安全地写入 HttpOnly Cookie
        public void SetTokenCookies(HttpContext httpContext, string accessToken, string refreshToken)
        {
            var isProduction = httpContext.Request.IsHttps;

            var accessCookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = isProduction, // 生产环境（HTTPS）下必须为 true
                SameSite = isProduction ? SameSiteMode.None : SameSiteMode.Lax,
                Path = "/",
                Expires = DateTime.UtcNow.AddMinutes(15)
            };

            var refreshCookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = isProduction,
                SameSite = isProduction ? SameSiteMode.None : SameSiteMode.Lax,
                Path = "/",
                Expires = DateTime.UtcNow.AddDays(7)
            };

            httpContext.Response.Cookies.Append("AccessToken", accessToken, accessCookieOptions);
            httpContext.Response.Cookies.Append("RefreshToken", refreshToken, refreshCookieOptions);
        }

        // 清理 Cookie
        public void ClearTokenCookies(HttpContext httpContext)
        {
            var isProduction = httpContext.Request.IsHttps;
            var options = new CookieOptions
            {
                HttpOnly = true,
                Secure = isProduction,
                SameSite = isProduction ? SameSiteMode.None : SameSiteMode.Lax,
                Path = "/"
            };

            httpContext.Response.Cookies.Delete("AccessToken", options);
            httpContext.Response.Cookies.Delete("RefreshToken", options);
        }
    }
}