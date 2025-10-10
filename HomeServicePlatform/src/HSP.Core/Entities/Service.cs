using HSP.Core.Interfaces.Entity;
using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Entities
{
	public class Service : BaseEntity<Guid>, IDateTracking, IHasSoftedDelete
	{
		[Required]
		[StringLength(100)]
		public string Name { get; set; } = string.Empty;

		[StringLength(100)]
		public string? Category { get; set; }

		[StringLength(500)]
		public string? Description { get; set; }

		public decimal BasePrice { get; set; }

		public bool IsDeleted { get; set; }
		public DateTime DateCreated { get; set; }
		public DateTime DateModified { get; set; }

		public ICollection<TechnicianProfile> Technicians { get; set; } = new List<TechnicianProfile>();
	}
}
