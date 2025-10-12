using HSP.Core.Interfaces.Entity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
	public class CustomerSupporter : BaseEntity<Guid>, IDateTracking, IHasSoftedDelete
	{
		[Required]
		public Guid UserId { get; set; }

		[ForeignKey("UserId")]
		public AppUser User { get; set; } = null!;

		[MaxLength(255)]
		public string? Note { get; set; }

		public bool IsActive { get; set; } = true;

		public DateTime DateCreated { get; set; }
		public DateTime DateModified { get; set; }
		public bool IsDeleted { get; set; }
	}
}
