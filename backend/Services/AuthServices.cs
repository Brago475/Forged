using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ForgedApi.Data;
using ForgedApi.DTOs;
using ForgedApi.Models;

namespace ForgedApi.Services;

public class AuthService
{
    private readonly ForgedDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(ForgedDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResponse?> Register(RegisterRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email.ToLower()))
            return null;
        if (await _db.Users.AnyAsync(u => u.Username == request.Username.ToLower()))
            return null;

        var user = new User
        {
            Email = request.Email.ToLower(),
            Username = request.Username.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            DisplayName = request.DisplayName
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return new AuthResponse(GenerateToken(user), ToDto(user));
    }

    public async Task<AuthResponse?> Login(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLower());
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        return new AuthResponse(GenerateToken(user), ToDto(user));
    }

    public async Task<UserDto?> GetUser(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId);
        return user == null ? null : ToDto(user);
    }

    public async Task<UserDto?> UpdateProfile(Guid userId, UpdateProfileRequest request)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return null;

        if (request.DisplayName != null) user.DisplayName = request.DisplayName;
        if (request.HeightInches.HasValue) user.HeightInches = request.HeightInches;
        if (request.StartingWeight.HasValue) user.StartingWeight = request.StartingWeight;
        if (request.GoalWeight.HasValue) user.GoalWeight = request.GoalWeight;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ToDto(user);
    }

    private string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt__Key"] ?? "default_dev_key"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var issuer = _config["Jwt__Issuer"] ?? "forgedgyms.com";

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: issuer,
            claims: new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Username)
            },
            expires: DateTime.UtcNow.AddDays(30),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserDto ToDto(User u) => new(
        u.Id, u.Email, u.Username, u.DisplayName,
        u.HeightInches, u.StartingWeight, u.GoalWeight
    );
}