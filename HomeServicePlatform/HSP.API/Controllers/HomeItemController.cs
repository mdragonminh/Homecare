using HSP.Core.Dtos.HomeItemDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

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
			var userId = GetUserId();
			try
			{
				var homeItemId = await _homeItemService.CreateHomeItemAsync(input, userId);
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
	}
}
