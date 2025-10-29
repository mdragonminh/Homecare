using HSP.Core.Abstractions.Entity;
using HSP.Core.Interfaces.Entity;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
	public class BookingItem : BaseEntity<Guid>, IHasSoftedDelete
	{
		public Guid BookingId { get; set; }
		[ForeignKey("BookingId")]
		public Booking Booking { get; set; } = null!;
		public Guid ServiceId { get; set; }
		[ForeignKey("ServiceId")]
		public Service Service { get; set; } = null!;
		public decimal Price { get; set; }
		public bool IsDeleted { get; set; } = false;
	}
}
