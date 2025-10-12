using HSP.Core.Interfaces.Entity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
	public class Equipment : BaseEntity<Guid>, IDateTracking, IHasSoftedDelete, IUserTracking
	{
		[Required, MaxLength(100)]
		public string Name { get; set; } = null!;

		[MaxLength(100)]
		public string? EquipmentCode { get; set; }

		public int Quantity { get; set; } = 0;

		[Required]
		public Guid WarehouseId { get; set; }

		[ForeignKey("WarehouseId")]
		public Warehouse Warehouse { get; set; } = null!;

		[MaxLength(255)]
		public string? Description { get; set; }

		public DateTime DateCreated { get; set; }
		public DateTime DateModified { get; set; }
		public bool IsDeleted { get; set; }
		public Guid? CreatedBy { get; set; }
		public Guid? ModifiedBy { get; set; }
	}
}
