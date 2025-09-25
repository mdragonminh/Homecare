using HSP.Core.Dtos.HomeItemDto;
using HSP.Core.Dtos.Shared;

namespace HSP.Service.Interfaces
{
	public interface IHomeItemService
	{
		public Task<Guid> CreateHomeItemAsync(CreateHomeItemDto input);
		public Task<PagedList<HomeItemDto>> GetAllHomeItemsAsync(HomeItemInput input, Guid homeId);
	}
}
