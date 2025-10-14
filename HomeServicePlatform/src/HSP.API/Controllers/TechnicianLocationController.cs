using HSP.Core.Constans;
using HSP.Core.Dtos.TechnicianProfileDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class TechnicianLocationController : ControllerBase
	{
		private readonly ITechnicianProfileService _technicianProfileService;
		public TechnicianLocationController(ITechnicianProfileService technicianProfileService)
		{
			_technicianProfileService = technicianProfileService;
		}
		[HttpPut("update-location")]
		[Authorize(Roles = RoleNames.Technician)]
		public async Task<IActionResult> UpdateLocation([FromBody] UpdateLocationDto input)
		{
			try
			{
				Guid CurrentTechId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new Exception("User ID not found"));
				await _technicianProfileService.UpdateLocationAsync(input, CurrentTechId);
				return Ok(new { message = "Update location success" });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { message = "error: ", error = ex.Message });
			}
		}
	}
}
