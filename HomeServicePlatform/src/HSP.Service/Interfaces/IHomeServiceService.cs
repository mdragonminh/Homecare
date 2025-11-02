using HSP.Core.Dtos.ServiceDto;
using HSP.Core.Dtos.Shared;

namespace HSP.Service.Interfaces
{
	public interface IHomeServiceService
	{
		Task<Guid> CreateHomeServiceAsync(Guid userId, CreateHomeServiceDto input);
		Task<PagedList<HomePagedServiceDto>> GetAllAsync(HomeServiceInput input);
		#region Home Page
		Task<IEnumerable<HomeServiceDto>> GetAllServiceHomePageAsync();
		#endregion
	}
}
