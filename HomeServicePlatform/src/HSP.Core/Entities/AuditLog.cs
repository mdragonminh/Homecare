using HSP.Core.Abstractions.Entity;
using HSP.Core.Enums;
using HSP.Core.Interfaces.Entity;
using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Entities
{
	public class AuditLog : BaseEntity<Guid>, IDateTracking, IHasSoftedDelete
	{
		[Required]
		public Guid UserId { get; set; }

		[Required, MaxLength(256)]
		public string UserName { get; set; } = null!;

		[Required, MaxLength(50)]
		public string UserRole { get; set; } = null!;

		[Required]
		public AuditAction Action { get; set; }

		[Required, MaxLength(100)]
		public string EntityName { get; set; } = null!;

		public Guid? EntityId { get; set; }

		public string? OldValue { get; set; }

		public string? NewValue { get; set; }

		[MaxLength(1000)]
		public string? Description { get; set; }

		public DateTime DateCreated { get; set; }
		public DateTime DateModified { get; set; }
		public bool IsDeleted { get; set; }

		public AppUser? User { get; set; }
	}
}
