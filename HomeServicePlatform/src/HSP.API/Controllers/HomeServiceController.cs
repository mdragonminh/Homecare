using HSP.API.Extensions;
using HSP.Core.Constans;
using HSP.Core.Dtos.ServiceDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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
			if (!ModelState.IsValid)
			{
				return BadRequest(ModelState);
			}
			var userId = User.GetUserId();
			var serviceId =  await _homeServiceService.CreateHomeServiceAsync(userId, input);
			return Ok(serviceId);
		}
		[HttpGet]
		[Authorize(Roles = RoleNames.Admin)]
		public async Task<IActionResult> GetAllHomeServices([FromQuery] HomeServiceInput input)
		{
			var services = await _homeServiceService.GetAllAsync(input);
			return Ok(services);
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
