using HSP.Core.Dtos.AccountDto;
using HSP.Core.Dtos.AuthenticationDto;

namespace HSP.Service.Interfaces
{
	public interface IJwtService
	{
		Task<string> GenerateJwtToken(UserDto input);
		Task<TokenResponseDto> GenerateTokenPairAsync(UserDto input);
		Task<TokenResponseDto> RefreshTokenAsync(string refreshToken);
		Task<bool> RevokeRefreshTokenAsync(Guid userId);
	}
}
