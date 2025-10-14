using HSP.Core.Dtos.CustomerProfileDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	[Authorize]
	public class CustomerProfileController : ControllerBase
	{
		private readonly ICustomerProfileService _customerProfileService;

		public CustomerProfileController(ICustomerProfileService customerProfileService)
		{
			_customerProfileService = customerProfileService;
		}

		[HttpGet]
		public async Task<ActionResult> GetCustomers([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? searchTerm = null)
		{
			try
			{
				var customers = await _customerProfileService.GetCustomersAsync(pageNumber, pageSize, searchTerm);
				return Ok(customers);
			}
			catch (Exception ex)
			{
				return StatusCode(500, $"Internal server error: {ex.Message}");
			}
		}

		[HttpGet("my-profile")]
		public async Task<ActionResult<CustomerProfileDto>> GetMyProfile()
		{
			try
			{
				var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
				if (string.IsNullOrEmpty(userId))
				{
					return Unauthorized("User not authenticated");
				}

				try
				{
					var profile = await _customerProfileService.GetCustomerProfileByUserIdAsync(userId);
					return Ok(profile);
				}
				catch (KeyNotFoundException)
				{
					if (Guid.TryParse(userId, out Guid userGuid))
					{
						var newProfileId = await _customerProfileService.CreateCustomerProfileAsync(userGuid);
						var newProfile = await _customerProfileService.GetCustomerProfileByIdAsync(newProfileId);
						return Ok(newProfile);
					}
					return NotFound($"Customer profile not found for user ID: {userId}");
				}
			}
			catch (Exception ex)
			{
				return StatusCode(500, $"Internal server error: {ex.Message}");
			}
		}

		[HttpGet("{id}")]
		public async Task<ActionResult<CustomerProfileDto>> GetProfileById(Guid id)
		{
			try
			{
				var profile = await _customerProfileService.GetCustomerProfileByIdAsync(id);
				return Ok(profile);
			}
			catch (KeyNotFoundException ex)
			{
				return NotFound(ex.Message);
			}
			catch (Exception ex)
			{
				return StatusCode(500, $"Internal server error: {ex.Message}");
			}
		}

		[HttpPut("my-profile")]
		public async Task<ActionResult<CustomerProfileDto>> UpdateMyProfile([FromBody] UpdateCustomerProfileDto updateDto)
		{
			try
			{
				var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
				if (string.IsNullOrEmpty(userId))
				{
					return Unauthorized("User not authenticated");
				}

				if (!ModelState.IsValid)
				{
					return BadRequest(ModelState);
				}

				var updatedProfile = await _customerProfileService.UpdateCustomerProfileAsync(userId, updateDto);
				return Ok(updatedProfile);
			}
			catch (KeyNotFoundException ex)
			{
				return NotFound(ex.Message);
			}
			catch (Exception ex)
			{
				return StatusCode(500, $"Internal server error: {ex.Message}");
			}
		}
	}
}
