using HSP.Core.Dtos.ServiceDto;

namespace HSP.Service.Interfaces
{
	public interface IHomeServiceService
	{
		Task<IEnumerable<HomeServiceDto>> GetAllServicesAsync(HomeServiceInput input);

		#region service category
		Task<IEnumerable<ServiceCategoryDto>> GetAllServicesCategoryAsync();
		#endregion
	}
}
