using HSP.Core.Dtos.PaymentDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	[Authorize]
	public class PaymentController : ControllerBase
	{
		private readonly IPaymentService _paymentService;

		public PaymentController(IPaymentService paymentService)
		{
			_paymentService = paymentService;
		}

		/// <summary>
		/// Create a new payment for a booking
		/// </summary>
		[HttpPost]
		public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentDto input)
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

				var result = await _paymentService.CreatePaymentAsync(input, userId);

				if (!result.Success)
					return BadRequest(new { message = result.Message });

				return Ok(result);
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}

		/// <summary>
		/// Get payment details by ID
		/// </summary>
		[HttpGet("{id}")]
		public async Task<IActionResult> GetPaymentById(Guid id)
		{
			try
			{
				var payment = await _paymentService.GetPaymentByIdAsync(id);
				if (payment == null)
					return NotFound(new { message = "Payment not found" });

				return Ok(payment);
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}

		/// <summary>
		/// Get all payments with filtering
		/// </summary>
		[HttpGet]
		public async Task<IActionResult> GetAllPayments([FromQuery] PaymentFilterDto filter)
		{
			try
			{
				var result = await _paymentService.GetAllPaymentsAsync(filter);
				return Ok(result);
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}

		/// <summary>
		/// Get payments by booking ID
		/// </summary>
		[HttpGet("booking/{bookingId}")]
		public async Task<IActionResult> GetPaymentsByBookingId(Guid bookingId)
		{
			try
			{
				var payments = await _paymentService.GetPaymentsByBookingIdAsync(bookingId);
				return Ok(payments);
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}

		/// <summary>
		/// Handle payment callback from SePay (webhook)
		/// </summary>
		[HttpPost("callback")]
		[AllowAnonymous]
		public async Task<IActionResult> PaymentCallback([FromBody] SePayWebhookDto webhook)
		{
			try
			{
				if (webhook == null)
				{
					Console.WriteLine("Webhook payload is null");
					return BadRequest(new { message = "Invalid webhook payload" });
				}

				Console.WriteLine($"Received webhook: Content={webhook.Content}, Amount={webhook.TransferAmount}");
				
				var result = await _paymentService.HandleSePayWebhookAsync(webhook);
				if (!result)
				{
					Console.WriteLine("Webhook processing failed");
					return Ok(new { message = "Webhook received but not processed (no matching payment)" });
				}

				Console.WriteLine("Webhook processed successfully");
				return Ok(new { message = "Callback processed successfully" });
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error in PaymentCallback: {ex.Message}");
				Console.WriteLine($"Stack trace: {ex.StackTrace}");
				return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
			}
		}

		/// <summary>
		/// Update payment status (Admin only)
		/// </summary>
		[HttpPut("status")]
		[Authorize(Roles = "Admin")]
		public async Task<IActionResult> UpdatePaymentStatus([FromBody] UpdatePaymentStatusDto input)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(ModelState);
			}

			try
			{
				var result = await _paymentService.UpdatePaymentStatusAsync(input);
				if (!result)
					return BadRequest(new { message = "Failed to update payment status" });

				return Ok(new { message = "Payment status updated successfully" });
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}

		/// <summary>
		/// Refund a payment (Admin only)
		/// </summary>
		[HttpPost("refund")]
		[Authorize(Roles = "Admin")]
		public async Task<IActionResult> RefundPayment([FromBody] RefundPaymentDto input)
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

				var result = await _paymentService.RefundPaymentAsync(input, userId);
				if (!result)
					return BadRequest(new { message = "Failed to refund payment" });

				return Ok(new { message = "Payment refunded successfully" });
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}

		/// <summary>
		/// Query payment status from SePay
		/// </summary>
		[HttpGet("{id}/query-status")]
		public async Task<IActionResult> QueryPaymentStatus(Guid id)
		{
			try
			{
				var payment = await _paymentService.QueryPaymentStatusAsync(id);
				if (payment == null)
					return NotFound(new { message = "Payment not found" });

				return Ok(payment);
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}

        [HttpPost("equipment")]
        public async Task<IActionResult> CreateEquipmentPayment([FromBody] CreateEquipmentPaymentDto input)
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

                var result = await _paymentService.CreateEquipmentPaymentAsync(input, userId);

                if (!result.Success)
                    return BadRequest(new { message = result.Message });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
