using HSP.Core.Dtos.PaymentDto;
using HSP.Core.Dtos.Shared;

namespace HSP.Service.Interfaces
{
	public interface IPaymentService
	{
		/// <summary>
		/// Create a new payment for a booking
		/// </summary>
		Task<PaymentResponseDto> CreatePaymentAsync(CreatePaymentDto input, string userId);

		Task<PaymentResponseDto> CreateEquipmentPaymentAsync(CreateEquipmentPaymentDto input, string userId);

        /// <summary>
        /// Get payment details by ID
        /// </summary>
        Task<PaymentDetailDto?> GetPaymentByIdAsync(Guid paymentId, Guid userId);

		/// <summary>
		/// Get all payments with filtering
		/// </summary>
		Task<PagedList<PaymentDto>> GetAllPaymentsAsync(PaymentFilterDto filter);

		/// <summary>
		/// Get payments by booking ID
		/// </summary>
		Task<List<PaymentDto>> GetPaymentsByBookingIdAsync(Guid bookingId);

		/// <summary>
		/// Handle payment callback from SePay
		/// </summary>
		Task<bool> HandlePaymentCallbackAsync(PaymentCallbackDto callback);

		/// <summary>
		/// Handle SePay webhook (real format from SePay)
		/// </summary>
		Task<bool> HandleSePayWebhookAsync(SePayWebhookDto webhook);

		/// <summary>
		/// Update payment status
		/// </summary>
		Task<bool> UpdatePaymentStatusAsync(UpdatePaymentStatusDto input);

		/// <summary>
		/// Refund a payment
		/// </summary>
		Task<bool> RefundPaymentAsync(RefundPaymentDto input, string userId);

		/// <summary>
		/// Query payment status from SePay
		/// </summary>
		Task<PaymentDetailDto?> QueryPaymentStatusAsync(Guid paymentId);
	}
}
