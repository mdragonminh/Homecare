using HSP.API.Extensions;
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
			if (!ModelState.IsValid)
			{
				return BadRequest(ModelState);
			}
			var userId = User.GetUserId();
			var serviceId = await _homeServiceService.CreateHomeServiceAsync(userId, input);
			return Ok(serviceId);
		}
		[HttpGet("services")]
		[Authorize(Roles = RoleNames.Admin)]
		public async Task<IActionResult> GetAllHomeServices([FromQuery] HomeServiceInput input)
		{
			var services = await _homeServiceService.GetAllAsync(input);
			return Ok(services);
		}
		[HttpGet]
		[Authorize(Roles = RoleNames.Admin)]
		public async Task<IActionResult> GetHomeServiceById([FromQuery] Guid id)
		{
			try
			{
				var service = await _homeServiceService.GetHomeServiceByIdAsync(id);
				return Ok(service);
			}
			catch (KeyNotFoundException ex)
			{
				return NotFound(ex.Message);
			}
			catch (Exception ex)
			{
				return StatusCode(500, ex.Message);
			}
		}
		[HttpPut("{id}")]
		[Authorize(Roles = RoleNames.Admin)]
		public async Task<IActionResult> UpdateHomeService([FromRoute] Guid id, [FromBody] UpdateHomeServiceDto input)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(ModelState);
			}
			var userId = User.GetUserId();
			try {
				await _homeServiceService.UpdateHomeServiceAsync(userId, id, input);
				return NoContent();
			}
			catch(KeyNotFoundException ex) { 
				return NotFound(ex.Message);
			}
			catch (ArgumentNullException ex)
			{
				return BadRequest(ex.Message);
			}
			catch (Exception ex)
			{
				return StatusCode(500, ex.Message);
			}
		}
		[HttpDelete("{id}")]
		[Authorize(Roles = RoleNames.Admin)]
		public async Task<IActionResult> DeleteHomeService([FromRoute] Guid id)
		{
			var userId = User.GetUserId();
			try
			{
				var result = await _homeServiceService.DeleteHomeServiceAsync(userId, id);
				if (result)
				{
					return NoContent();
				}
				else
				{
					return NotFound();
				}
			}
			catch (UnauthorizedAccessException ex)
			{
				return Forbid(ex.Message);
			}
			catch (InvalidOperationException ex)
			{
				return Conflict(new { message = ex.Message });
			}
			catch (Exception ex)
			{
				return StatusCode(500, ex.Message);
			}
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
