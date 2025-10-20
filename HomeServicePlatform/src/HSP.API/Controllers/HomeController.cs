using HSP.Core.Constans;
using HSP.Core.Dtos.HomeDto;
using HSP.Service.Dtos.HomeDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	[Authorize(Roles = RoleNames.Customer)]
	public class HomeController : ControllerBase
	{
		private readonly IHomeService _homeService;
		//private readonly ICustomerProfileService _customerProfileService;
		public HomeController(IHomeService homeService/*, ICustomerProfileService customerProfileService*/)
		{
			_homeService = homeService;
			//_customerProfileService = customerProfileService;
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
				var userIdString = GetUserId();
				//var customerProfile = await _customerProfileService.GetCustomerProfileByUserIdAsync(userIdString);
				var homeId = await _homeService.CreateHomeAsync(input, Guid.Parse(userIdString));
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
			var userIdString = GetUserId();
			var homes = await _homeService.GetAllHomesAsync(input, userIdString);
			return Ok(homes);
		}
		[HttpDelete("{homeId}")]
		public async Task<IActionResult> DeleteHome(Guid homeId)
		{
			try
			{
				var userIdString = GetUserId();
				await _homeService.DeleteHomeAsynce(homeId, userIdString);
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
		public async Task<IActionResult> UpdateHome(Guid homeId,[FromBody] UpdateHomeDto input)
		{
			try
			{
				if (!ModelState.IsValid)
				{
					return BadRequest(ModelState);
				}
				var userIdString = GetUserId();
				await _homeService.UpdateHomeAsync(homeId, input, userIdString);
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
		public async Task<IActionResult> GetHomeById(Guid homeId) { 			
			try
			{
				var userIdString = GetUserId();
				var home = await _homeService.GetHomeByIdAsync(homeId, userIdString);
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
