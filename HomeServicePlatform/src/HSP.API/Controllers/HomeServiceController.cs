using HSP.Core.Dtos.ServiceDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class HomeServiceController : ControllerBase
	{
		private readonly IHomeServiceService _homeServiceService;
		public HomeServiceController(IHomeServiceService homeServiceService)
		{
			_homeServiceService = homeServiceService;
		}
		[HttpGet("services")]
		public async Task<IActionResult> GetAllServices([FromQuery] HomeServiceInput input)
		{
			var services = await _homeServiceService.GetAllServicesAsync(input);
			return Ok(services);
		}
		#region service category
		[HttpGet("service-categories")]
		public async Task<IActionResult> GetAllServiceCategories()
		{
			var categories = await _homeServiceService.GetAllServicesCategoryAsync();
			return Ok(categories);
		}
		#endregion
	}
}
