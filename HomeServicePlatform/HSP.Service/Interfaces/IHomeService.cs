using HSP.Core.Dtos.HomeDto;
using HSP.Core.Dtos.Shared;
using HSP.Service.Dtos.HomeDto;

namespace HSP.Service.Interfaces
{
	public interface IHomeService
	{
		public Task<Guid> CreateHomeAsync(CreateHomeDto input, Guid customerProfileId);
		public Task<PagedList<HomeDto>> GetAllHomesAsync(HomeInput input, string userId);
		public Task<HomeDto> GetHomeByIdAsync(Guid homeId, string userId);
		public Task<bool> DeleteHomeAsynce(Guid homeId, string userId);
		public Task<bool> UpdateHomeAsync(Guid homeId, UpdateHomeDto input, string userId);
	}
}
