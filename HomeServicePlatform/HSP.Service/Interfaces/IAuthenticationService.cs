using HSP.Service.Dtos.AuthenticationDto;

namespace HSP.Service.Interfaces
{
	public interface IAuthenticationService
	{
		Task<RegisterResponseDto> Register(RegisterRequestDto input);
		Task<RegisterResponseDto> RegisterTechnician(RegisterTechnicianRequestDto input);
		Task<bool> ConfirmEmail(Guid userId, string token);
		Task<LoginResponseDto> Login(LoginRequestDto input);
		Task<LoginResponseDto> GoogleLogin();
		Task<ChangePasswordResponseDto> ChangePassword(Guid userId, ChangePasswordRequestDto input);
	}
}
