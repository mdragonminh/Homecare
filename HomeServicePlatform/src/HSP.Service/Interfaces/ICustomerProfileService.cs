using HSP.Core.Dtos.CustomerProfileDto;

namespace HSP.Service.Interfaces
{
	public interface ICustomerProfileService
	{
		Task<Guid> CreateCustomerProfileAsync(Guid userId);
		Task<CustomerProfileDto> GetCustomerProfileByUserIdAsync(string userId);
		Task<CustomerProfileDto> GetCustomerProfileByIdAsync(Guid profileId);
		Task<CustomerProfileDto> UpdateCustomerProfileAsync(string userId, UpdateCustomerProfileDto updateDto);
		Task<object> GetDebugInfoAsync();
	}
}
