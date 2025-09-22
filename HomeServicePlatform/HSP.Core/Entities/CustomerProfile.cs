using HSP.Core.Interfaces;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
	public class CustomerProfile : BaseEntity<Guid>, IDateTracking, IHasSoftedDelete
	{
		public Guid UserId { get; set; }
		[ForeignKey("UserId")]
		public AppUser User { get; set; } = null!;
		
		public DateTime DateCreated { get; set; }
		public DateTime DateModified { get; set; }
		public bool IsDeleted { get ; set ; }

		public ICollection<Home> Homes { get; set; } = new List<Home>();

	}
}
