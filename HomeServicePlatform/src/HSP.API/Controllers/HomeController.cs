using HSP.API.Extensions;
using HSP.Core.Constans;
using HSP.Core.Dtos.HomeDto;
using HSP.Service.Dtos.HomeDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	[Authorize(Roles = RoleNames.Customer)]
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
			try
			{
				if (!ModelState.IsValid)
				{
					return BadRequest(ModelState);
				}
				var userId = User.GetUserId();
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
			var userId = User.GetUserId();
			var homes = await _homeService.GetAllHomesAsync(input, userId);
			return Ok(homes);
		}
		[HttpDelete("{homeId}")]
		public async Task<IActionResult> DeleteHome(Guid homeId)
		{
			try
			{
				var userId = User.GetUserId();
				await _homeService.DeleteHomeAsynce(homeId, userId);
				return NoContent();
			}
			catch (ValidationException ex)
			{
				return NotFound(new { message = ex.Message });
			}
			catch (Exception ex)
			{
				return StatusCode(500);
			}
		}
		[HttpPut("{homeId}")]
		public async Task<IActionResult> UpdateHome(Guid homeId, [FromBody] UpdateHomeDto input)
		{
			try
			{
				if (!ModelState.IsValid)
				{
					return BadRequest(ModelState);
				}
				var userId = User.GetUserId();
				await _homeService.UpdateHomeAsync(homeId, input, userId);
				return NoContent();
			}
			catch (ValidationException ex)
			{
				return NotFound(new { message = ex.Message });
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { message = ex.Message });
			}
			catch (Exception ex)
			{
				return StatusCode(500);
			}
		}
		[HttpGet("{homeId}")]
		public async Task<IActionResult> GetHomeById(Guid homeId)
		{
			try
			{
				var userId = User.GetUserId();
				var home = await _homeService.GetHomeByIdAsync(homeId, userId);
				return Ok(home);
			}
			catch (ValidationException ex)
			{
				return NotFound(new { message = ex.Message });
			}
			catch (Exception ex)
			{
				return StatusCode(500);
			}
		}
	}
}
