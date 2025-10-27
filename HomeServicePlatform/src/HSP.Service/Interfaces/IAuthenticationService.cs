using HSP.Core.Dtos.AuthenticationDto;
using HSP.Service.Dtos.AuthenticationDto;
using HSP.Service.Dtos.EmailDto;

namespace HSP.Service.Interfaces
{
	public interface IAuthenticationService
	{
		Task<RegisterResponseDto> Register(RegisterRequestDto input);
		Task<RegisterResponseDto> RegisterTechnician(RegisterTechnicianRequestDto input);
		Task<ConfirmEmailResultDto> ConfirmEmail(Guid userId, string token);
		Task<LoginResponseDto> Login(LoginRequestDto input);
		Task<LoginResponseDto> GoogleLogin();
		Task<ChangePasswordResponseDto> ChangePassword(Guid userId, ChangePasswordRequestDto input);
		Task<bool> AddPasswordAsync(Guid userId, AddPasswordDto input);
		Task<Guid> CreateOperatorAsync(CreateOperatorRequestDto input);
		Task<bool> RequestPasswordResetAsync(ForgetPasswordDto input);
		Task<bool> ResetPasswordAsync(Core.Dtos.AuthenticationDto.ResetPasswordDto input);
	}
}
