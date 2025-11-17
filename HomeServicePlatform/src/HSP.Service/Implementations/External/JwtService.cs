using HSP.Core.Dtos.AccountDto;
using HSP.Core.Dtos.AuthenticationDto;
using HSP.Core.Dtos.ConfigurationDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Service.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace HSP.Service.Implementations.External
{
	public class JwtService : IJwtService
	{
		private readonly IUserRepository _userRepository;
		private readonly JwtSettingsDto _jwtSettings;

		public JwtService(IUserRepository userRepository,
			IOptions<JwtSettingsDto> options)
		{
			_userRepository = userRepository;
			_jwtSettings = options.Value;
		}

		public async Task<string> GenerateJwtToken(UserDto input)
		{
			if (input == null)
			{
				throw new ArgumentNullException(nameof(input));
			}
			var user = new AppUser
			{
				Id = input.Id,
				Email = input.Email,
				FullName = input.FullName ?? string.Empty
			};
			var roles = await _userRepository.GetRolesAsync(user);
			var claims = new List<Claim>
			{
						new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
						new Claim(ClaimTypes.Email, user.Email),
						new Claim(ClaimTypes.Name, user.FullName),
				};
			foreach (var role in roles)
			{
				claims.Add(new Claim(ClaimTypes.Role, role));
			}
			var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
			var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

			var token = new JwtSecurityToken(
					issuer: _jwtSettings.Issuer,
					audience: _jwtSettings.Audience,
					claims: claims,
					expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationInMinutes),
					signingCredentials: creds
			);

			return new JwtSecurityTokenHandler().WriteToken(token);
		}

		public async Task<TokenResponseDto> GenerateTokenPairAsync(UserDto input)
		{
			if (input == null)
				throw new ArgumentNullException(nameof(input));
			var user = await _userRepository.FindByIdAsync(input.Id)
				?? throw new InvalidOperationException("User not found");
			var roles = await _userRepository.GetRolesAsync(user);
            var claims = new List<Claim>
            {
                        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                        new Claim(ClaimTypes.Email, user.Email??string.Empty),
                        new Claim(ClaimTypes.Name, user.FullName),
                };
            foreach (var role in roles)
				claims.Add(new Claim(ClaimTypes.Role, role));
			var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
			var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

			var accessTokenExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationInMinutes);
			var refreshTokenExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationInDays);

			var jwt = new JwtSecurityToken(
				issuer: _jwtSettings.Issuer,
				audience: _jwtSettings.Audience,
				claims: claims,
				expires: accessTokenExpiresAt,
				signingCredentials: creds
			);

			string accessToken = new JwtSecurityTokenHandler().WriteToken(jwt);
			string refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
			var existingToken = await _userRepository.GetAuthenticationTokenAsync(user, "Default", "RefreshToken");

			if (!string.IsNullOrEmpty(existingToken))
			{
				await _userRepository.RemoveAuthenticationTokenAsync(user, "Default", "RefreshToken");
			}
			await _userRepository.SetAuthenticationTokenAsync(user, "Default", "RefreshToken", refreshToken);
			return new TokenResponseDto
			{
				AccessToken = accessToken,
				RefreshToken = refreshToken,
				AccessTokenExpiresAt = accessTokenExpiresAt,
				RefreshTokenExpiresAt = refreshTokenExpiresAt
			};
		}

		public async Task<TokenResponseDto> RefreshTokenAsync(string refreshToken)
		{
			if (string.IsNullOrEmpty(refreshToken))
				throw new UnauthorizedAccessException("Refresh token is missing.");

			var user = await _userRepository.FindByTokenAsync(refreshToken);

			if (user == null)
				throw new UnauthorizedAccessException("Invalid refresh token.");

			await _userRepository.RemoveAuthenticationTokenAsync(user, "Default", "RefreshToken");
			return await GenerateTokenPairAsync(new UserDto
			{
				Id = user.Id,
				Email = user.Email ?? string.Empty,
				FullName = user.FullName ?? string.Empty
			});
		}

		public async Task<bool> RevokeRefreshTokenAsync(Guid userId)
		{
			var user = await _userRepository.FindByIdAsync(userId)
				?? throw new UnauthorizedAccessException("User not found.");

			await _userRepository.RemoveAuthenticationTokenAsync(user, "Default", "RefreshToken");
			return true;
		}
	}
}
