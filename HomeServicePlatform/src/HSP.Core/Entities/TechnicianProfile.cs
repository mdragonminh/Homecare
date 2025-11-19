using HSP.Core.Abstractions.Entity;
using HSP.Core.Enums;
using HSP.Core.Interfaces.Entity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
	public class TechnicianProfile : BaseEntity<Guid>, IApprovable, IDateTracking, IHasSoftedDelete
	{
		[Required]
		public Guid UserId { get; set; }
		[ForeignKey("UserId")]
		public AppUser User { get; set; } = null!;
		[Required]
		[MaxLength(12)]
		public string CitizenId { get; set; } = null!;
		[Range(-90, 90)]
		public double Latitude { get; set; }
		[Range(-180, 180)]
		public double Longitude { get; set; }

		[MaxLength(255)]
		public string? Address { get; set; }
		
		[Range(0, 50)]
		public int ExperienceYears { get; set; }

        [MaxLength(500)]
        public string? RejectionReason { get; set; }

        [Required]
		public TechnicianApprovalStatus ApprovalStatus { get; set; } = TechnicianApprovalStatus.Pending;
		public DateTime? ApprovedAt { get; set; }
		public string? ApprovedBy { get; set; }
		public DateTime DateCreated { get; set; }
		public DateTime DateModified { get; set; }
		public bool IsDeleted { get; set; }

		public ICollection<Service> Services { get; set; } = new List<Service>();
		public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
	}
}
