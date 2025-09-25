using HSP.Core.Dtos.HomeItemDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class HomeItemController : ControllerBase
	{
		private readonly IHomeItemService _homeItemService;

		public HomeItemController(IHomeItemService homeItemService)
		{
			_homeItemService = homeItemService;
		}
		[HttpPost("add-home-item")]
		public async Task<IActionResult> AddHomeItem([FromBody] CreateHomeItemDto input)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest();
			}
			try
			{
				var homeItemId = await _homeItemService.CreateHomeItemAsync(input);
				return Ok(new { HomeItemId = homeItemId });
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
		[HttpGet("list-home-item")]
		public async Task<IActionResult> ListHomeItem([FromQuery] HomeItemInput input, [FromQuery] Guid homeId)
		{
			var result = await _homeItemService.GetAllHomeItemsAsync(input, homeId);
			return Ok(result);
		}
	}
}
