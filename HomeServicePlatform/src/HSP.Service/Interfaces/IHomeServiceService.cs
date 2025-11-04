using HSP.Core.Dtos.ServiceDto;
using HSP.Core.Dtos.Shared;

namespace HSP.Service.Interfaces
{
	public interface IHomeServiceService
	{
		Task<Guid> CreateHomeServiceAsync(Guid userId, CreateHomeServiceDto input);
		Task<PagedList<HomePagedServiceDto>> GetAllAsync(HomeServiceInput input);
		Task<bool> UpdateHomeServiceAsync(Guid userId, Guid id, UpdateHomeServiceDto input);
		Task<bool> DeleteHomeServiceAsync(Guid userId, Guid id);
		#region Home Page
		Task<IEnumerable<HomeServiceDto>> GetAllServiceHomePageAsync();
		#endregion
	}
}
