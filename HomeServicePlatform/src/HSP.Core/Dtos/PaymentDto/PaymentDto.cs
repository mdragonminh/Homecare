using HSP.Core.Enums;

namespace HSP.Core.Dtos.PaymentDto
{
	public class PaymentDto
	{
		public Guid Id { get; set; }
		public Guid BookingId { get; set; }
		public decimal Amount { get; set; }
		public decimal ShippingFee { get; set; }
		public PaymentMethod PaymentMethod { get; set; }
		public PaymentStatus Status { get; set; }
		public PaymentType Type { get; set; }
		public string? TransactionId { get; set; }
		public string? SePayOrderId { get; set; }
		public DateTime? PaidAt { get; set; }
		public string? Description { get; set; }
		public DateTime DateCreated { get; set; }
		public DateTime DateModified { get; set; }
	}

	public class CreatePaymentDto
	{
		public Guid BookingId { get; set; }
		public decimal Amount { get; set; }
		public PaymentMethod PaymentMethod { get; set; }
		public string? Description { get; set; }
	}

    public class CreateEquipmentPaymentDto
    {
        public Guid BookingId { get; set; }
        public List<Guid> BookingEquipmentIds { get; set; } = new(); 
        public PaymentMethod PaymentMethod { get; set; }
        public string? Description { get; set; }
    }

    public class PaymentDetailDto : PaymentDto
	{
		public string? PaymentUrl { get; set; }
		public string? FailureReason { get; set; }
		public DateTime? RefundedAt { get; set; }
		public string? RefundReason { get; set; }
	}

	public class UpdatePaymentStatusDto
	{
		public Guid PaymentId { get; set; }
		public PaymentStatus Status { get; set; }
		public string? TransactionId { get; set; }
		public string? FailureReason { get; set; }
	}

	public class RefundPaymentDto
	{
		public Guid PaymentId { get; set; }
		public string Reason { get; set; } = string.Empty;
	}

	public class PaymentCallbackDto
	{
		public string? OrderId { get; set; }
		public string? TransactionRef { get; set; }
		public decimal Amount { get; set; }
		public string? Status { get; set; }
		public string? Message { get; set; }
		public string? Signature { get; set; }
	}

	// Real SePay webhook format
	public class SePayWebhookDto
	{
		public string? Gateway { get; set; }
		public string? TransactionDate { get; set; }
		public string? AccountNumber { get; set; }
		public string? SubAccount { get; set; }
		public string? Code { get; set; }
		public string? Content { get; set; }
		public string? TransferType { get; set; }
		public string? Description { get; set; }
		public decimal TransferAmount { get; set; }
		public string? ReferenceCode { get; set; }
		public decimal Accumulated { get; set; }
		public int Id { get; set; }
	}

	public class PaymentResponseDto
	{
		public bool Success { get; set; }
		public string? Message { get; set; }
		public PaymentDto? Payment { get; set; }
		public string? PaymentUrl { get; set; }
	}

	// SePay Integration DTOs
	public class SePayCreateOrderRequest
	{
		public string OrderId { get; set; } = string.Empty;
		public decimal Amount { get; set; }
		public string Description { get; set; } = string.Empty;
		public string ReturnUrl { get; set; } = string.Empty;
		public string CallbackUrl { get; set; } = string.Empty;
		public string? BuyerName { get; set; }
		public string? BuyerEmail { get; set; }
		public string? BuyerPhone { get; set; }
	}

	public class SePayCreateOrderResponse
	{
		public bool Success { get; set; }
		public string? Message { get; set; }
		public string? OrderId { get; set; }
		public string? PaymentUrl { get; set; }
		public string? QrCode { get; set; }
	}

	public class SePayQueryResponse
	{
		public bool Success { get; set; }
		public string? Status { get; set; }
		public string? TransactionRef { get; set; }
		public decimal Amount { get; set; }
		public DateTime? PaidAt { get; set; }
		public string? Message { get; set; }
	}

	public class SePayRefundRequest
	{
		public string OrderId { get; set; } = string.Empty;
		public string TransactionRef { get; set; } = string.Empty;
		public decimal Amount { get; set; }
		public string Reason { get; set; } = string.Empty;
	}

	public class SePayRefundResponse
	{
		public bool Success { get; set; }
		public string? Message { get; set; }
		public string? RefundId { get; set; }
	}

	public class PaymentFilterDto : HSP.Core.Dtos.Shared.PaginationParams
	{
		public Guid? BookingId { get; set; }
		public Guid? CustomerId { get; set; }
		public PaymentStatus? Status { get; set; }
		public PaymentMethod? PaymentMethod { get; set; }
		public DateTime? FromDate { get; set; }
		public DateTime? ToDate { get; set; }
		public string? SearchTerm { get; set; }
	}
}
