using HSP.Core.Dtos.PaymentDto;

namespace HSP.Core.Abstractions.External
{
	public interface ISePayService
	{
		/// <summary>
		/// Create a payment order with SePay
		/// </summary>
		Task<SePayCreateOrderResponse> CreatePaymentOrderAsync(SePayCreateOrderRequest request);

		/// <summary>
		/// Query payment status from SePay
		/// </summary>
		Task<SePayQueryResponse> QueryPaymentStatusAsync(string orderId);

		/// <summary>
		/// Verify callback signature from SePay
		/// </summary>
		bool VerifyCallbackSignature(PaymentCallbackDto callback);

		/// <summary>
		/// Request refund from SePay
		/// </summary>
		Task<SePayRefundResponse> RefundPaymentAsync(SePayRefundRequest request);
	}
}
