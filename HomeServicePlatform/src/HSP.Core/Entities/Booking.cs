using HSP.Core.Interfaces.Entity;
using HSP.Core.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
	public class Booking : BaseEntity<Guid>, IDateTracking, IHasSoftedDelete
	{
		public Guid CustomerId { get; set; }
		[ForeignKey("CustomerId")]
		public AppUser Customer { get; set; } = null!;
		public Guid? TechnicianId { get; set; }
		[ForeignKey("TechnicianId")]
		public TechnicianProfile? Technician { get; set; } = null!;
		//public Guid ServiceId { get; set; }
		//[ForeignKey("ServiceId")]
		//public Service Service { get; set; } = null!;
		public DateTime? DesiredDate { get; set; }
		[MaxLength(1000)]
		public string? ProblemDescription { get; set; }
		public BookingStatus Status { get; set; } = BookingStatus.Pending;

		public DateTime? DateCompleted { get; set; }


		public BookingFeedback? Feedback { get; set; }
		public BookingCancellation? Cancellation { get; set; }

		[NotMapped]
		public ICollection<FileRelation> Files { get; set; } = new List<FileRelation>();

		public bool IsDeleted { get; set; }
		public DateTime DateCreated { get; set; }
		public DateTime DateModified { get; set; }
		public ICollection<BookingItem> Items { get; set; } = new List<BookingItem>();
	}
}
