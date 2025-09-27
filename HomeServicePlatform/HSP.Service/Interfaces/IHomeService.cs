using HSP.Core.Dtos.HomeDto;
using HSP.Core.Dtos.Shared;
using HSP.Service.Dtos.HomeDto;

namespace HSP.Service.Interfaces
{
	public interface IHomeService
	{
		public Task<Guid> CreateHomeAsync(CreateHomeDto input, string userId);
		public Task<PagedList<HomeDto>> GetAllHomesAsync(HomeInput input, string userId);
	}
}
