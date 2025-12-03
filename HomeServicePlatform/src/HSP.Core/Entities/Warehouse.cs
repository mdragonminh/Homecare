using HSP.Core.Abstractions.Entity;
using HSP.Core.Interfaces.Entity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
	public class Warehouse : BaseEntity<Guid>, IDateTracking, IHasSoftedDelete, IUserTracking
	{
		[Required, MaxLength(100)]
		public string Name { get; set; } = null!;

		[Required, MaxLength(255)]
		public string Address { get; set; }
		[Required]
		public Guid ManagerId { get; set; }
		[ForeignKey("ManagerId")]
		public AppUser? Manager { get; set; }

		public ICollection<Equipment> Equipments { get; set; } = new List<Equipment>();

		public DateTime DateCreated { get; set; }
		public DateTime DateModified { get; set; }
		public bool IsDeleted { get; set; }
		public Guid? CreatedBy { get; set; }
		public Guid? ModifiedBy { get; set; }
	}
}
