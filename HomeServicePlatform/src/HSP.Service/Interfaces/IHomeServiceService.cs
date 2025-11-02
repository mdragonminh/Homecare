using HSP.Core.Dtos.ServiceDto;

namespace HSP.Service.Interfaces
{
	public interface IHomeServiceService
	{
		Task<Guid> CreateHomeService(CreateHomeServiceDto input);
		#region Home Page
		Task<IEnumerable<HomeServiceDto>> GetAllServiceHomePageAsync();
		#endregion
	}
}
