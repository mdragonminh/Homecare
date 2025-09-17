using HSP.Core.Entities;
using HSP.Core.Interfaces;
using HSP.Service.Dtos.AuthenticationDto;
using HSP.Service.Interfaces;

namespace HSP.Service.Implementations
{
	public class AuthenticationService : IAuthenticationService
	{
		private readonly IUserRepository _userRepository;

		public AuthenticationService(IUserRepository userRepository)
		{
			_userRepository = userRepository;
		}

		public async Task<bool> ConfirmEmail(Guid userId, string token)
		{
			var user = await _userRepository.FindByIdAsync(userId);
			if (user == null) return false;
			var result = await _userRepository.ConfirmEmailAsync(user, token);
			return true;
		}

		public async Task<RegisterResponseDto> Register(RegisterRequestDto input)
		{
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
				var errorMessage = string.Join(", ", created.Errors.Select(e => e.Description));
				throw new Exception($"User creation failed: {errorMessage}");
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
