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

		/// <summary>
		/// Lấy thông tin profile của customer hiện tại
		/// </summary>
		/// <returns>Thông tin chi tiết của customer profile</returns>
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
					// Nếu chưa có profile, tự động tạo một cái mới
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

		/// <summary>
		/// Lấy thông tin profile của customer theo ID
		/// </summary>
		/// <param name="id">ID của customer profile</param>
		/// <returns>Thông tin chi tiết của customer profile</returns>
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

		/// <summary>
		/// Debug endpoint - Xem thông tin claims trong token
		/// </summary>
		/// <returns>Danh sách claims trong token</returns>
		[HttpGet("debug/token-info")]
		public ActionResult GetTokenInfo()
		{
			var claims = User.Claims.Select(c => new { 
				Type = c.Type, 
				Value = c.Value 
			}).ToList();

			var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
			var email = User.FindFirstValue(ClaimTypes.Email);
			var name = User.FindFirstValue(ClaimTypes.Name);

			return Ok(new {
				UserId = userId,
				Email = email,
				Name = name,
				AllClaims = claims
			});
		}

		/// <summary>
		/// Debug endpoint - Kiểm tra tất cả profiles trong database
		/// </summary>
		/// <returns>Danh sách tất cả profiles</returns>
		[HttpGet("debug/all-profiles")]
		public async Task<ActionResult> GetAllProfiles()
		{
			try
			{
				var debugInfo = await _customerProfileService.GetDebugInfoAsync();
				return Ok(debugInfo);
			}
			catch (Exception ex)
			{
				return StatusCode(500, $"Error: {ex.Message}");
			}
		}
	}
}
