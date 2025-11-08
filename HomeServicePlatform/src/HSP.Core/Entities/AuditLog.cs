using HSP.Core.Abstractions.Entity;
using HSP.Core.Interfaces.Entity;
using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Entities
{
	public class AuditLog : BaseEntity<Guid>, IDateTracking
	{
		[Required]
		public Guid UserId { get; set; }

		[MaxLength(255)]
		public string UserName { get; set; } = null!;

		[Required, MaxLength(50)]
		public string Action { get; set; } = null!; 

		[Required, MaxLength(100)]
		public string EntityType { get; set; } = null!;

		public Guid? EntityId { get; set; } 

		[MaxLength(200)]
		public string? EntityName { get; set; } 

		public string? OldValue { get; set; } 

		public string? NewValue { get; set; }

		[MaxLength(50)]
		public string? IpAddress { get; set; }

		[MaxLength(500)]
		public string? UserAgent { get; set; }
		public DateTime DateCreated { get; set; }
		public DateTime DateModified { get; set; }
		public AppUser? User { get; set; }
	}
}
