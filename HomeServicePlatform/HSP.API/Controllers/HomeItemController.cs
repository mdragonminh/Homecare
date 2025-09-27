using HSP.Core.Constans;
using HSP.Core.Dtos.HomeItemDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	[Authorize(Roles = RoleNames.Customer)]
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
		[HttpDelete("{homeItemId}")]
		public async Task<IActionResult> DeleteHomeItem(Guid homeItemId)
		{
			var userId = GetUserId();
			try
			{
				var result = await _homeItemService.DeleteHomeItemAsync(homeItemId, userId);
				return NoContent();
			}
			catch (ValidationException ex)
			{
				return BadRequest(new { message = ex.Message });
			}
			catch (Exception ex)
			{
				return StatusCode(500, ex.Message);
			}
		}
		[HttpGet("{homeItemId}")]
		public async Task<IActionResult> GetHomeItemById(Guid homeItemId)
		{
			var userId = GetUserId();
			try
			{
				var result = await _homeItemService.GetHomeItemByIdAsync(homeItemId, userId);
				return Ok(result);
			}
			catch (ValidationException ex)
			{
				return BadRequest(new { message = ex.Message });
			}
			catch (Exception ex)
			{
				return StatusCode(500, ex.Message);
			}
		}
		[HttpPut("{homeItemId}")]
		public async Task<IActionResult> UpdateHomeItem(Guid homeItemId, [FromBody] UpdateHomeItemDto input)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(ModelState);
			}
			var userId = GetUserId();
			try
			{
				var result = await _homeItemService.UpdateHomeItemAsync(homeItemId, input, userId);
				return NoContent();
			}
			catch (ValidationException ex)
			{
				return BadRequest(new { message = ex.Message });
			}
			catch (Exception ex)
			{
				return StatusCode(500, ex.Message);
			}
		}
		private string GetUserId()
		{
			var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
			if (string.IsNullOrEmpty(userIdString))
			{
				throw new UnauthorizedAccessException("User is not authenticated.");
			}
			return userIdString;
		}
	}
}
