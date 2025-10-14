using HSP.Core.Interfaces.Entity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
	public class Booking : BaseEntity<Guid>, IDateTracking, IHasSoftedDelete
	{
		public Guid CustomerProfileId { get; set; }
		public Guid? TechnicianId { get; set; }
		public Guid ServiceId { get; set; }

		[Required]
		public DateTime DesiredDate { get; set; }
		[MaxLength(1000)]
		public string? ProblemDescription { get; set; }
		public BookingStatus Status { get; set; } = BookingStatus.Pending;

		public DateTime? DateCompleted { get; set; }

		public CustomerProfile Customer { get; set; } = null!;
		public TechnicianProfile? Technician { get; set; }
		public Service Service { get; set; } = null!;

		public BookingFeedback? Feedback { get; set; }
		public BookingCancellation? Cancellation { get; set; }

		[NotMapped]
		public ICollection<FileRelation> Files { get; set; } = new List<FileRelation>();

		public bool IsDeleted { get; set; }
		public DateTime DateCreated { get; set; }
		public DateTime DateModified { get; set; }
	}
}
