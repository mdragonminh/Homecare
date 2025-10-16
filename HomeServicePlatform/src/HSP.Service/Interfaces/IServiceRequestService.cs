using HSP.Core.Dtos.BookingDto;
using HSP.Core.Dtos.ServiceRequestDto;

namespace HSP.Service.Interfaces
{
	public interface IServiceRequestService
	{
		Task<IEnumerable<TechnicianResultDto>> SearchNearbyTechniciansAsync(SearchTechnicianInput input);
	}
}
