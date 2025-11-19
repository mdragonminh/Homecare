using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
	public class BookingFeedback 
    {
		public Guid BookingId { get; set; }
		[ForeignKey("BookingId")]
		public Booking Booking { get; set; } = null!;

		[Range(1, 5)]
		public int Rating { get; set; }

		[MaxLength(1000)]
		public string? Comment { get; set; }
	}
}
