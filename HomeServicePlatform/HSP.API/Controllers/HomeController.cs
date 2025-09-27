using HSP.Core.Dtos.HomeDto;
using HSP.Service.Dtos.HomeDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class HomeController : ControllerBase
	{
		private readonly IHomeService _homeService;
		public HomeController(IHomeService homeService)
		{
			_homeService = homeService;
		}
		[HttpPost("create-home")]
		public async Task<IActionResult> CreateHome([FromBody] CreateHomeDto input)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest();
			}
			var userId = GetUserById();
			try
			{
				var homeId = await _homeService.CreateHomeAsync(input, userId);
				return Ok(new { HomeId = homeId });
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { message = ex.Message });
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}
		[HttpGet("list-home")]
		public async Task<IActionResult> GetAllHomes([FromQuery] HomeInput input)
		{
			var homes = await _homeService.GetAllHomesAsync(input);
			return Ok(homes);
		}
	}
}
