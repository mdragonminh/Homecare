using HSP.Core.Dtos.AppUserDto;

namespace HSP.Service.Interfaces
{
	public interface ICustomerProfileService
	{
		Task<AppUserDto> GetCustomerByUserIdAsync(string userId);
		Task<AppUserDto> GetCustomerByIdAsync(Guid userId);
		Task<AppUserDto> UpdateCustomerAsync(string userId, UpdateAppUserDto updateDto);
		Task<object> GetCustomersAsync(int pageNumber = 1, int pageSize = 10, string? searchTerm = null);
		Task<object> GetDebugInfoAsync();
		Task<EmailChangeResponseDto> RequestEmailChangeAsync(string userId, string newEmail);
		Task<EmailChangeResponseDto> ConfirmEmailChangeAsync(string userId, string token);
	}
}
