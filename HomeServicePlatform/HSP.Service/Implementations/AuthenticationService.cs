using HSP.Core.Entities;
using HSP.Core.Interfaces;
using HSP.Service.Dtos.AuthenticationDto;
using HSP.Service.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace HSP.Service.Implementations
{
	public class AuthenticationService : IAuthenticationService
	{
		private readonly IUserRepository _userRepository;
		private readonly IConfiguration _configuration;

		public AuthenticationService(IUserRepository userRepository, IConfiguration configuration)
		{
			_userRepository = userRepository;
			_configuration = configuration;
		}

		public async Task<bool> ConfirmEmail(Guid userId, string token)
		{
			var user = await _userRepository.FindByIdAsync(userId);
			if (user == null) return false;
			var result = await _userRepository.ConfirmEmailAsync(user, token);
			return true;
		}

		public async Task<LoginResponseDto> Login(LoginRequestDto input)
		{
			if(input == null)
			{
				throw new ArgumentException("Input cannot be null");
			}
			var user = await _userRepository.FindByEmailAsync(input.Email);
			if (user == null)
			{
				throw new ValidationException("Invalid email or password");
			}
			bool passwordValid = await _userRepository.CheckPasswordAsync(user, input.Password);
			if (!passwordValid)
			{
				throw new UnauthorizedAccessException("Invalid password.");
			}
			var token = GenerateJwtToken(user.Id.ToString(), input.Email);
			return new LoginResponseDto
			{
				JwtToken = token,
				UserId = user.Id.ToString(),
				Email = input.Email
			};
		}
		private string GenerateJwtToken(string userId, string email)
		{
			var claims = new[]
			{
						new Claim(ClaimTypes.NameIdentifier, userId),
						new Claim(ClaimTypes.Email, email),
				};

			var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:SecretKey"]));
			var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

			var token = new JwtSecurityToken(
					issuer: _configuration["JwtSettings:Issuer"],
					audience: _configuration["JwtSettings:Audience"],
					claims: claims,
					expires: DateTime.Now.AddHours(1),
					signingCredentials: creds
			);

			return new JwtSecurityTokenHandler().WriteToken(token);
		}

		public async Task<RegisterResponseDto> Register(RegisterRequestDto input)
		{
			if(input == null)
			{
				throw new ArgumentException("Input cannot be null");
			}
			if(input.Password != input.ConfirmPassword)
			{
				throw new ValidationException("Password and Confirm Password do not match");
			}
			var user = new AppUser
			{
				Email = input.Email,
				UserName = input.Email,
				FullName = input.FullName,
				EmailConfirmed = false
			};
			var created = await _userRepository.CreateAsync(user, input.Password);
			if (!created.Succeeded)
			{
				throw new Exception($"User creation failed");
			}
			var token = await _userRepository.GenerateEmailConfirmationTokenAsync(user);
			return new RegisterResponseDto
			{
				UserId = user.Id,
				Email = user.Email,
				EmailConfirmToken = token
			};
		}
	}
}
