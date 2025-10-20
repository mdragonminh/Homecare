using HSP.Core.Interfaces.Entity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
	public class Home : BaseEntity<Guid>, IDateTracking, IHasSoftedDelete
	{
		[Required]
		[StringLength(100)]
		public string Name { get; set; } = string.Empty;

		[Required]
		[StringLength(200)]
		public string Address { get; set; } = string.Empty;

		[Required]
		[Range(-90, 90)]
		public double Latitude { get; set; }
		[Required]
		[Range(-180, 180)]
		public double Longitude { get; set; }

		public Guid CustomerId { get; set; }
		[ForeignKey("CustomerId")]
		public AppUser CustomerProfile { get; set; } = null!;
		public ICollection<HomeItem> HomeItems { get; set; } = new List<HomeItem>();
		public bool IsDeleted { get ; set; }
		public DateTime DateCreated { get; set; }
		public DateTime DateModified { get; set; }
	}
}
