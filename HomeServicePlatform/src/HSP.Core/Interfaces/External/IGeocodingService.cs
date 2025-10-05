using HSP.Core.Dtos.MapDto;

namespace HSP.Core.Interfaces.External
{
	public interface IGeocodingService
	{
		Task<CoordinatesDto?> GetCoordinatesForAddressAsync(string address);
	}
}
