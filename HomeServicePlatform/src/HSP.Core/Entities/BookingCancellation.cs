using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
	public class BookingCancellation
	{
		public Guid BookingId { get; set; }
		[ForeignKey("BookingId")]
		public Booking Booking { get; set; } = null!;

		[MaxLength(500)]
		public string? Reason { get; set; }

		public Guid? CancelledBy { get; set; }
		public DateTime CancelledAt { get; set; } = DateTime.UtcNow;
	}
}
