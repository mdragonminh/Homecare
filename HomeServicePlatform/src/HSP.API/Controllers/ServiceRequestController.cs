using HSP.Core.Dtos.ServiceRequestDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Linq.Expressions;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class ServiceRequestController : ControllerBase
	{
		private readonly IServiceRequestService _serviceRequestService;

		public ServiceRequestController(IServiceRequestService serviceRequestService)
		{
			_serviceRequestService = serviceRequestService;
		}
		[HttpGet("nearby-technicians")]
		public async Task<IActionResult> GetNearbyTechnicians([FromQuery] SearchTechnicianInput input)
		{
			var result = await _serviceRequestService.SearchNearbyTechniciansAsync(input);
			return Ok(result);
		}
		[HttpPost("create-and-match-booking")]
		public async Task<IActionResult> CreateAndMatchBooking([FromBody] CustomerCreateBookingDto input)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(ModelState);
			}
			try
			{
				var result = await _serviceRequestService.CreateAndMatchBookingAsync(input);
				return Ok(result);
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
