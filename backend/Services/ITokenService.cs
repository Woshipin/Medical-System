// Services/ITokenService.cs
using System.Security.Claims;
using MedicalSystem.Models;

namespace MedicalSystem.Services
{
    public interface ITokenService
    {
        string GenerateAccessToken(User user);
        Task<string> GenerateRefreshTokenAsync(int userId);
        void SetTokenCookies(HttpContext httpContext, string accessToken, string refreshToken);
        void ClearTokenCookies(HttpContext httpContext);
    }
}