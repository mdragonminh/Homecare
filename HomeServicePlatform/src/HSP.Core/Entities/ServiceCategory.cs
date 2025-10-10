using HSP.Core.Interfaces.Entity;
using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Entities
{
	public class ServiceCategory : BaseEntity<Guid>, IDateTracking, IHasSoftedDelete
	{
		[Required]
		[StringLength(100)]
		public string Name { get; set; } = string.Empty;
		[StringLength(255)]
		public string? Description { get; set; }
		public DateTime DateCreated { get; set; }
		public DateTime DateModified { get; set; }
		public bool IsDeleted { get; set; }

		public ICollection<Service> Services { get; set; } = new List<Service>();
	}
}
