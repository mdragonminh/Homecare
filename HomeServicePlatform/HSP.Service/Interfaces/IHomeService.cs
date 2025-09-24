using HSP.Core.Dtos.HomeDto;
using HSP.Core.Dtos.Shared;
using HSP.Service.Dtos.HomeDto;

namespace HSP.Service.Interfaces
{
	public interface IHomeService
	{
		public Task<Guid> CreateHomeAsync(CreateHomeDto input);
		public Task<PagedList<HomeDto>> GetAllHomesAsync(HomeInput input);
	}
}
