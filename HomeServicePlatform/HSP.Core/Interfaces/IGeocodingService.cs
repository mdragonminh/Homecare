using HSP.Core.Dtos.MapDto;

namespace HSP.Core.Interfaces
{
	public interface IGeocodingService
	{
		Task<CoordinatesDto?> GetCoordinatesForAddressAsync(string address);
	}
}
