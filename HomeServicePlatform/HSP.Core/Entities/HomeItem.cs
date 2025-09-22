using HSP.Core.Interfaces;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
	public class HomeItem : BaseEntity<Guid>, IDateTracking, IHasSoftedDelete
	{
		[Required]
		[StringLength(100)]
		public string Name { get; set; }
		[StringLength(100)]
		public string? Brand { get; set; }
		[Required]
		[StringLength(50)]
		public string Type { get; set; }
		[StringLength(100)]
		public string? ModelNumber { get; set; }
		[StringLength(100)]
		public string? SerialNumber { get; set; }
		[StringLength(1000)]
		public string? Notes { get; set; }
		public Guid HomeId { get; set; }
		[ForeignKey("HomeId")]
		public Home Home { get; set; }
		public bool IsDeleted { get; set; }
		public DateTime DateCreated { get; set; }
		public DateTime DateModified { get; set; }
	}
}
