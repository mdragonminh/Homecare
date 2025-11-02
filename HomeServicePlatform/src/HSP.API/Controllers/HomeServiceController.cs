using HSP.Core.Constans;
using HSP.Core.Dtos.ServiceDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
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
		[HttpPost]
		[Authorize(Roles = RoleNames.Admin)]
		public async Task<IActionResult> CreateHomeService([FromBody] CreateHomeServiceDto input)
		{
			var serviceId =  await _homeServiceService.CreateHomeService(input);
			return Ok(serviceId);
		}
		#region Home Page
		[HttpGet("services-homepage")]
		public async Task<IActionResult> GetAllServiceHomePage()
		{
			var services = await _homeServiceService.GetAllServiceHomePageAsync();
			return Ok(services);
		}
		#endregion
	}
}
