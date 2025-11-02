using HSP.API.Extensions;
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
		private readonly ITechnicianLocationService _technicianLocationService;

		public TechnicianLocationController(ITechnicianLocationService technicianLocationService)
		{
			_technicianLocationService = technicianLocationService;
		}

		[HttpPut("update-location")]
		[Authorize(Roles = RoleNames.Technician)]
		public async Task<IActionResult> UpdateLocation([FromBody] UpdateLocationDto input)
		{
			try
			{
				Guid CurrentTechId = User.GetUserId();
				await _technicianLocationService.UpdateLocationAsync(input, CurrentTechId);
				return Ok(new { message = "Update location success"});
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { message = "error: ", error = ex.Message });
			}
		}
	}
}
