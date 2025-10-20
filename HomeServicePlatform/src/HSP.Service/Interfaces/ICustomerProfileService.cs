using HSP.Core.Dtos.CustomerProfileDto;

namespace HSP.Service.Interfaces
{
	public interface ICustomerProfileService
	{
		//Task<Guid> CreateCustomerProfileAsync(Guid userId);
		//Task<CustomerProfileDto> GetCustomerProfileByUserIdAsync(string userId);
		Task<CustomerProfileDto> GetCustomerProfileByIdAsync(Guid profileId);
		Task<CustomerProfileDto> UpdateCustomerProfileAsync(string userId, UpdateCustomerProfileDto updateDto);
		Task<object> GetCustomersAsync(int pageNumber = 1, int pageSize = 10, string? searchTerm = null);
		Task<object> GetDebugInfoAsync();
		Task<EmailChangeResponseDto> RequestEmailChangeAsync(string userId, string newEmail);
		Task<EmailChangeResponseDto> ConfirmEmailChangeAsync(string userId, string token);
	}
}
