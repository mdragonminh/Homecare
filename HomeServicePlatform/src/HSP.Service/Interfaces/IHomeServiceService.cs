using HSP.Core.Dtos.ServiceDto;

namespace HSP.Service.Interfaces
{
	public interface IHomeServiceService
	{
		//Task<IEnumerable<ServiceGroupDto>> GetAllServicesAsync(HomeServiceInput input);
		Task<IEnumerable<HomeServiceDto>> GetAllServiceHomePageAsync();

		#region service category
		//Task<IEnumerable<ServiceCategoryDto>> GetAllServicesCategoryAsync();
		#endregion
	}
}
