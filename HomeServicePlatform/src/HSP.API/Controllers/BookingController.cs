using HSP.Core.Dtos.BookingDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.DAL.UnitOfWorks;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Razor.Templating.Core;
using System.Security.Claims;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class BookingController : ControllerBase
	{
		private readonly IBookingService _bookingService;
		private readonly IRepository<TechnicianProfile, Guid> _technicianRepository;

		public BookingController(IBookingService bookingService, IRepository<TechnicianProfile, Guid> technicianRepository)
		{
			_bookingService = bookingService;
			_technicianRepository = technicianRepository;
		}

		/// <summary>
		/// Lấy danh sách tất cả booking được gán cho technician hiện tại
		/// </summary>
		[HttpGet]
		public async Task<IActionResult> GetAllBookings([FromQuery] BookingInput input)
		{
			try
			{
				// Lấy user ID từ JWT token
				var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
				if (string.IsNullOrEmpty(userId))
					return Unauthorized();

				// Lấy technician profile từ user ID
				var technicianProfile = await _technicianRepository.GetAll()
						.FirstOrDefaultAsync(t => t.UserId.ToString() == userId);

				if (technicianProfile == null)
					return BadRequest(new { message = "Technician profile not found" });

				// Chỉ lấy booking của technician hiện tại
				input.TechnicianId = technicianProfile.Id;

				var result = await _bookingService.GetAllBookingsAsync(input);
				return Ok(result);
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}

		/// <summary>
		/// Xem chi tiết booking
		/// </summary>
		[HttpGet("{id}")]
		public async Task<IActionResult> GetBookingDetail(Guid id)
		{
			try
			{
				var result = await _bookingService.GetBookingDetailAsync(id);
				if (result == null)
					return NotFound(new { message = "Booking not found" });

				// Kiểm tra xem booking này có được gán cho technician hiện tại không
				var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
				var technicianProfile = await _technicianRepository.GetAll()
						.FirstOrDefaultAsync(t => t.UserId.ToString() == userId);

				if (technicianProfile == null || result.TechnicianId != technicianProfile.Id)
					return Forbid("You can only view bookings assigned to you");

				return Ok(result);
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}

		/// <summary>
		/// Hoàn thành booking
		/// </summary>
		[HttpPost("{id}/complete")]
		public async Task<IActionResult> CompleteBooking(Guid id)
		{
			try
			{
				var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
				if (string.IsNullOrEmpty(userId))
					return Unauthorized();

				var statusDto = new UpdateBookingStatusDto
				{
					BookingId = id,
					Status = HSP.Core.Enums.BookingStatus.Completed
				};

				var result = await _bookingService.UpdateBookingStatusAsync(statusDto, userId);
				if (result)
					return Ok(new { message = "Booking completed successfully" });

				return BadRequest(new { message = "Unable to complete booking. Please check if the booking is assigned to you and is in valid status." });
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}

		/// <summary>
		/// Từ chối/hủy booking
		/// </summary>
		[HttpPost("{id}/cancel")]
		public async Task<IActionResult> CancelBooking(Guid id, [FromBody] RejectBookingDto input)
		{
			try
			{
				var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
				if (string.IsNullOrEmpty(userId))
					return Unauthorized();

				var cancelDto = new CancelBookingDto
				{
					BookingId = id,
					Reason = input.Reason
				};

				var result = await _bookingService.CancelBookingAsync(cancelDto, userId);
				if (result)
					return Ok(new { message = "Booking cancelled successfully" });

				return BadRequest(new { message = "Unable to cancel booking. Please check if the booking is assigned to you and is in valid status." });
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}

		/// <summary>
		/// Cập nhật trạng thái booking
		/// </summary>
		[HttpPut("{id}/status")]
		public async Task<IActionResult> UpdateBookingStatus(Guid id, [FromBody] UpdateBookingStatusDto input)
		{
			try
			{
				var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
				if (string.IsNullOrEmpty(userId))
					return Unauthorized();

				input.BookingId = id;
				var result = await _bookingService.UpdateBookingStatusAsync(input, userId);
				if (result)
					return Ok(new { message = "Booking status updated successfully" });

				return BadRequest(new { message = "Unable to update booking status. Please check if the booking is assigned to you." });
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}

		[HttpGet("accept")]
		public async Task<IActionResult> AcceptBookingEmail(
						[FromQuery] Guid customerId,
						[FromQuery] Guid technicianId,
						[FromQuery] string token,
						[FromQuery] List<Guid> ServiceIds,
						[FromQuery] DateTime desiredDate)
		{
			try
			{
				var result = await _bookingService.AcceptBookingEmailAsync(customerId, technicianId, ServiceIds, token, desiredDate);

				if (result.IsSuccess)
				{
					var html = await RazorTemplateEngine.RenderAsync("/Views/Bookings/BookingAccepted.cshtml");
					return new ContentResult { Content = html, ContentType = "text/html" };
				}
				else
				{
					var html = await RazorTemplateEngine.RenderAsync("/Views/Bookings/BookingError.cshtml", new { Message = result.Message });
					return new ContentResult { Content = html, ContentType = "text/html" };
				}
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}
	}
}
