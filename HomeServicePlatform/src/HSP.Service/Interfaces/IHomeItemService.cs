using HSP.Core.Dtos.HomeItemDto;
using HSP.Core.Dtos.Shared;

namespace HSP.Service.Interfaces
{
	public interface IHomeItemService
	{
		public Task<bool> DeleteHomeItemAsync(Guid homeItemId, Guid userId);
		Task<bool> UpdateHomeItemAsync(Guid homeItemId, UpdateHomeItemDto input, Guid userId);
		Task<HomeItemDto> GetHomeItemByIdAsync(Guid homeItemId, Guid userId);
		public Task<PagedList<HomeItemDto>> GetAllHomeItemsAsync(HomeItemInput input, Guid homeId, Guid userId);
		public Task<Guid> CreateHomeItemAsync(CreateHomeItemDto input, Guid userId);
	}
}
