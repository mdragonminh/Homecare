using HSP.API.Extensions;
using HSP.API.Filters;
using HSP.Core.Constans;
using HSP.Core.Dtos.BookingDto;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Service.Implementations;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Razor.Templating.Core;
using System.Security.Claims;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class BookingController : ControllerBase
	{
		private readonly IBookingService _bookingService;
		private readonly IFeedbackService _feedbackService;
		private readonly IRepository<TechnicianProfile, Guid> _technicianRepository;

		public BookingController(IBookingService bookingService, IFeedbackService feedbackService, IRepository<TechnicianProfile, Guid> technicianRepository)
		{
			_bookingService = bookingService;
            _feedbackService = feedbackService;
			_technicianRepository = technicianRepository;
		}

		/// <summary>
		/// Lấy danh sách booking cho customer hiện tại
		/// </summary>
		[HttpGet("my-bookings")]
		public async Task<IActionResult> GetMyBookings([FromQuery] BookingInput input)
		{
			try
			{
				// Lấy user ID từ JWT token
				var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
				if (string.IsNullOrEmpty(userId))
					return Unauthorized();

				// Chuyển userId thành Guid để filter theo CustomerId
				if (!Guid.TryParse(userId, out Guid customerGuid))
					return BadRequest(new { message = "Invalid user ID format" });

				// Chỉ lấy booking của customer hiện tại
				input.CustomerId = customerGuid;

				var result = await _bookingService.GetAllBookingsAsync(input);
				return Ok(result);
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}

		/// <summary> 
		/// Lấy danh sách tất cả bookings cho admin, operator
		/// </summary>
		[HttpGet("admin/all")]
		[Authorize(Roles = RoleNames.Admin + "," + RoleNames.Operator)]
		public async Task<IActionResult> GetAllBookingsForAdmin([FromQuery] BookingInput input)
		{
			try
			{
				var result = await _bookingService.GetAllBookingsAsync(input);
				return Ok(result);
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
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

		[HttpGet("{id}")]
		public async Task<IActionResult> GetBookingDetail(Guid id)
		{
			try
			{
				var result = await _bookingService.GetBookingDetailAsync(id);
				if (result == null)
					return NotFound(new { message = "Booking not found" });
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
		[AuditLog(AuditAction.Update, "Booking")]
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

		[HttpPost("{id}/cancel")]
		[AuditLog(AuditAction.Update, "Booking")]
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
        [HttpPost("{id}/technician-reject")]
        public async Task<IActionResult> TechnicianReject(Guid id)
        {
            var technicianUserId = User.GetUserId();
            var result = await _bookingService.TechnicianRejectAsync(id, technicianUserId);
            return Ok(result);
        }

        /// <summary>
        /// Cập nhật trạng thái booking
        /// </summary>
        [HttpPut("{id}/status")]
		[AuditLog(AuditAction.Update, "Booking")]
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

        [HttpPost("accept")]
        public async Task<IActionResult> AcceptBooking([FromBody] AcceptBookingDto input)
        {
            try
            {
                var userId = User.GetUserId();

                var result = await _bookingService.AcceptBookingAsync(userId, input);

                if (!result.IsSuccess)
                    return BadRequest(new { message = result.Message });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("{bookingId}/feedback")]
        public async Task<IActionResult> CreateFeedback(Guid bookingId, [FromBody] CreateFeedbackDto input)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(); 

                var feedbackDto = await _feedbackService.CreateFeedbackAsync(bookingId, input, userId);

                return Ok(feedbackDto);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message }); 
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message); 
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500);
            }
        }

        [HttpPost("{id}/equipments")]
        [Authorize]
        public async Task<IActionResult> AddEquipmentToBooking(Guid id, [FromBody] AddBookingEquipmentDto input)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out Guid userGuid))
                    return Unauthorized();

                var result = await _bookingService.AddEquipmentToBookingAsync(id, input, userGuid);

                return Ok(new { message = "Đã thêm thiết bị vào booking thành công" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(); 
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống", details = ex.Message });
            }
        }

        [HttpDelete("{id}/equipments/{bookingEquipmentId}")]
        [Authorize]
        public async Task<IActionResult> RemoveEquipment(Guid id, Guid bookingEquipmentId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out Guid userGuid))
                    return Unauthorized();

                await _bookingService.RemoveEquipmentFromBookingAsync(id, bookingEquipmentId, userGuid);
                return Ok(new { message = "Đã xóa thiết bị khỏi đơn hàng" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
