using HSP.Core.Dtos.HomeDto;
using HSP.Core.Dtos.Shared;
using HSP.Service.Dtos.HomeDto;

namespace HSP.Service.Interfaces
{
	public interface IHomeService
	{
		public Task<Guid> CreateHomeAsync(CreateHomeDto input, Guid customerProfileId);
		public Task<PagedList<HomeDto>> GetAllHomesAsync(HomeInput input, Guid userId);
		public Task<HomeDto> GetHomeByIdAsync(Guid homeId, Guid userId);
		public Task<bool> DeleteHomeAsynce(Guid homeId, Guid userId);
		public Task<bool> UpdateHomeAsync(Guid homeId, UpdateHomeDto input, Guid userId);
	}
}
