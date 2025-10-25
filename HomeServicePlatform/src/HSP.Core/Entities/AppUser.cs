using HSP.Core.Interfaces.Entity;
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
	[Table("AppUsers")]
	public class AppUser : IdentityUser<Guid>, IDateTracking
	{
		[Required]
		[StringLength(100)]
		public string FullName { get; set; } = string.Empty;

		[StringLength(100)]
		public string? Department { get; set; }

		public bool IsActive { get; set; } = true;

		//public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
		//public DateTime? UpdatedAt { get; set; }
		public DateTime? LastLoginAt { get; set; }
		public DateTime? DisabledAt { get; set; }

		public string? CreatedBy { get; set; }
		public string? UpdatedBy { get; set; }
		public string? DisabledReason { get; set; }
        public bool MustChangePasswordOnLogin { get; set; } = false;

        //public CustomerProfile? CustomerProfile { get; set; }
        public TechnicianProfile? TechnicianProfile { get; set; }
		public DateTime DateCreated { get; set; } = DateTime.UtcNow;
		public DateTime DateModified { get; set; }
		public ICollection<Home> Homes { get; set; } = new List<Home>();
		public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
	}
}
