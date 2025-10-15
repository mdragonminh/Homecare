using HSP.Core.Dtos.TechnicianProfileDto;

namespace HSP.Service.Interfaces
{
	public interface ITechnicianLocationService
	{
		Task UpdateLocationAsync(UpdateLocationDto input, Guid CurrentTechId);
	}
}