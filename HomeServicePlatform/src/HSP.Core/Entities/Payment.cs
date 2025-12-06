using HSP.Core.Abstractions.Entity;
using HSP.Core.Enums;
using HSP.Core.Interfaces.Entity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
	public class Payment : BaseEntity<Guid>, IDateTracking, IHasSoftedDelete
	{
		public Guid BookingId { get; set; }
		[ForeignKey("BookingId")]
		public Booking Booking { get; set; } = null!;

		[Required]
		[Column(TypeName = "decimal(18,2)")]
		public decimal Amount { get; set; }

		[Required]
		public PaymentMethod PaymentMethod { get; set; }

		[Required]
		public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

		[MaxLength(500)]
		public string? TransactionId { get; set; }

		[MaxLength(500)]
		public string? SePayOrderId { get; set; }

		[MaxLength(1000)]
		public string? SePayTransactionRef { get; set; }

		public DateTime? PaidAt { get; set; }

		[MaxLength(2000)]
		public string? Description { get; set; }

		[MaxLength(2000)]
		public string? PaymentUrl { get; set; }

		[MaxLength(4000)]
		public string? SePayResponse { get; set; }

		[MaxLength(1000)]
		public string? FailureReason { get; set; }

		public DateTime? RefundedAt { get; set; }

		[MaxLength(2000)]
		public string? RefundReason { get; set; }
        public PaymentType Type { get; set; } = PaymentType.Service;

        public ICollection<BookingEquipment> BookingEquipments { get; set; } = new List<BookingEquipment>();

        public bool IsDeleted { get; set; }
		public DateTime DateCreated { get; set; }
		public DateTime DateModified { get; set; }
	}
}
