using HSP.Core.Dtos.AccountDto;
using HSP.Core.Dtos.ConfigurationDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Service.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace HSP.Service.Implementations
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
			if(input == null)
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
	}
}
