using HSP.Core.Dtos.HomeItemDto;
using HSP.Core.Dtos.Shared;

namespace HSP.Service.Interfaces
{
	public interface IHomeItemService
	{
		public Task<bool> DeleteHomeItemAsync(Guid homeItemId, string userId);
		Task<bool> UpdateHomeItemAsync(Guid homeItemId, UpdateHomeItemDto input, string userId);
		Task<HomeItemDto> GetHomeItemByIdAsync(Guid homeItemId, string userId);
		public Task<PagedList<HomeItemDto>> GetAllHomeItemsAsync(HomeItemInput input, Guid homeId, string userId);
		public Task<Guid> CreateHomeItemAsync(CreateHomeItemDto input, string userId);
	}
}
