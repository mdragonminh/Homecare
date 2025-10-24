using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
	public class BookingItem : BaseEntity<Guid>
	{
		public Guid BookingId { get; set; }
		[ForeignKey("BookingId")]
		public Booking Booking { get; set; } = null!;
		public Guid ServiceId { get; set; }
		[ForeignKey("ServiceId")]
		public Service Service { get; set; } = null!;
		public decimal Price { get; set; }
	}
}
