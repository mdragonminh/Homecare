using HSP.Service.Dtos.AuthenticationDto;

namespace HSP.Service.Interfaces
{
	public interface IAuthenticationService
	{
		Task<RegisterResponseDto> Register(RegisterRequestDto input);

	}
}
