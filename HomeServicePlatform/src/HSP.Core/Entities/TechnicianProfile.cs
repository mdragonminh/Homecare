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

		[Range(0, 50)]
		public int ExperienceYears { get; set; }

		[Required]
		public TechnicianApprovalStatus ApprovalStatus { get; set; } = TechnicianApprovalStatus.Pending;

		[Required]
		[Column(TypeName = "decimal(9,6)")]
		public decimal Latitude { get; set; }

		[Required]
		[Column(TypeName = "decimal(9,6)")]
		public decimal Longitude { get; set; }

		[MaxLength(255)]
		public string? Address { get; set; }

		public DateTime? ApprovedAt { get; set; }
		public string? ApprovedBy { get; set; }
		public DateTime DateCreated { get ; set ; }
		public DateTime DateModified { get; set; }
		public bool IsDeleted { get ; set ; }

		public ICollection<Service> Services { get; set; } = new List<Service>();
	}
}
