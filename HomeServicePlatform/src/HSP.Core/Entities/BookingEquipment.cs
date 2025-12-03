using HSP.Core.Abstractions.Entity;
using HSP.Core.Interfaces.Entity;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
	public class BookingEquipment : BaseEntity<Guid>, IHasSoftedDelete
	{
        public Guid BookingId { get; set; }
        [ForeignKey("BookingId")]
        public Booking Booking { get; set; } = null!;

        public Guid EquipmentId { get; set; }
        [ForeignKey("EquipmentId")]
        public Equipment Equipment { get; set; } = null!;

        public int Quantity { get; set; } 

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        public bool IsDeleted { get; set; } = false;
    }
}
