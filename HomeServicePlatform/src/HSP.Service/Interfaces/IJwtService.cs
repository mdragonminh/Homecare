using HSP.Core.Dtos.AccountDto;
using HSP.Core.Entities;

namespace HSP.Service.Interfaces
{
	public interface IJwtService
	{
		Task<string> GenerateJwtToken(UserDto input);
	}
}
