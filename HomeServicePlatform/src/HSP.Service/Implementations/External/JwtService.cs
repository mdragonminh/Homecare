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
            var user = await _userRepository.FindByIdAsync(input.Id)
           ?? throw new InvalidOperationException("User not found");

            var roles = await _userRepository.GetRolesAsync(user);

            string accessToken = GenerateAccessToken(user, roles);
            string refreshToken = GenerateRefreshToken();

            var refreshExpires = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationInDays);

            //await _userRepository.RemoveAllTokensForUserAsync(user.Id);

            await _userRepository.AddRefreshTokenAsync(user.Id, refreshToken, refreshExpires);

            return new TokenResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                AccessTokenExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationInMinutes),
                RefreshTokenExpiresAt = refreshExpires
            };
        }
        private string GenerateAccessToken(AppUser user, IList<string> roles)
        {
            var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
            new Claim(ClaimTypes.Name, user.FullName ?? string.Empty)
        };

            foreach (var role in roles)
                claims.Add(new Claim(ClaimTypes.Role, role));

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var jwt = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationInMinutes),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(jwt);
        }
        private string GenerateRefreshToken()
        {
            return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        }

        public async Task<TokenResponseDto> RefreshTokenAsync(string refreshToken)
		{
            var tokenEntity = await _userRepository.GetRefreshTokenAsync(refreshToken);

            if (tokenEntity == null || tokenEntity.IsExpired)
                throw new UnauthorizedAccessException("Invalid refresh token.");

            var user = await _userRepository.FindByIdAsync(tokenEntity.UserId)
                ?? throw new UnauthorizedAccessException("User not found.");

            await _userRepository.RevokeRefreshTokenAsync(refreshToken);

            return await GenerateTokenPairAsync(new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? "",
                FullName = user.FullName ?? ""
            });
        }

		public async Task<bool> RevokeRefreshTokenAsync(Guid userId)
		{
			var user = await _userRepository.FindByIdAsync(userId)
				?? throw new UnauthorizedAccessException("User not found.");

			await _userRepository.RemoveAllTokensForUserAsync(userId);
			return true;
		}
	}
}
