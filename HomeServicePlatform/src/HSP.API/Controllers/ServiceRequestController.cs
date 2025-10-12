using HSP.Core.Dtos.ServiceRequestDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Mvc;

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
	}
}
