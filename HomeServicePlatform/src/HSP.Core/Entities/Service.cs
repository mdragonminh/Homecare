using HSP.Core.Abstractions.Entity;
using HSP.Core.Interfaces.Entity;
using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Entities
{
	public class Service : BaseEntity<Guid>, IDateTracking, IHasSoftedDelete, IUserTracking
	{
		[Required]
		[StringLength(100)]
		public string Name { get; set; } = null!;
		[Required]
		[Range(0, double.MaxValue)]
		public decimal Price { get; set; }
		[StringLength(500)]
		public string? Description { get; set; }
		public bool IsDeleted { get; set; }
		public DateTime DateCreated { get; set; }
		public DateTime DateModified { get; set; }
		public Guid? CreatedBy { get; set; }
		public Guid? ModifiedBy { get; set; }
		public ICollection<TechnicianProfile> Technicians { get; set; } = new List<TechnicianProfile>();
		public ICollection<BookingItem> BookingItems { get; set; } = new List<BookingItem>();
	}
}