using Microsoft.AspNetCore.Http;

namespace HSP.Service.Interfaces
{
	public interface IOcrService
	{
		Task<string?> ExtractCitizenIdAsync(IFormFile file);
	}
}
