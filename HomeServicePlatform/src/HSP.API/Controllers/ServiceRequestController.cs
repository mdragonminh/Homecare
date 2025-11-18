using HSP.Core.Dtos.ServiceRequestDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Mvc;
using HSP.Core.Dtos.BookingDto;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class ServiceRequestController : ControllerBase
	{
		private readonly IServiceRequestService _serviceRequestService;
		private readonly ITechnicianProfileService _technicianProfileService;
		private readonly IBookingService _bookingService;

		public ServiceRequestController(
			IServiceRequestService serviceRequestService, 
			ITechnicianProfileService technicianProfileService,
			IBookingService bookingService)
		{
			_serviceRequestService = serviceRequestService;
			_technicianProfileService = technicianProfileService;
			_bookingService = bookingService;
		}
		[HttpGet("nearby-technicians")]
		public async Task<IActionResult> GetNearbyTechnicians([FromQuery] SearchTechnicianInput input)
		{
			var result = await _serviceRequestService.SearchNearbyTechniciansAsync(input);
			return Ok(result);
		}

		[HttpGet("technician-profile/{id}")]
		public async Task<IActionResult> GetTechnicianProfile(Guid id)
		{
			try
			{
				var result = await _technicianProfileService.GetTechnicianByIdAsync(id);
				if (result == null)
				{
					return NotFound(new { message = "Không tìm thấy technician" });
				}
				return Ok(result);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { message = "Đã có lỗi xảy ra khi lấy thông tin technician", error = ex.Message });
			}
		}

		[HttpGet("technician-feedbacks/{technicianId}")]
		public async Task<IActionResult> GetTechnicianFeedbacks(Guid technicianId)
		{
			try
			{
				var bookingInput = new BookingInput
				{
					TechnicianId = technicianId,
					PageNumber = 1,
					PageSize = 1000,
					Status = HSP.Core.Enums.BookingStatus.Completed
				};

				var result = await _bookingService.GetAllBookingsAsync(bookingInput);
				return Ok(result);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { message = "Đã có lỗi xảy ra khi lấy đánh giá", error = ex.Message });
			}
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
