using HSP.Core.Dtos.Shared;
using HSP.Core.Enums;

namespace HSP.Core.Dtos.AuditLogDto
{
	public class AuditLogDto
	{
		public Guid Id { get; set; }
		public Guid UserId { get; set; }
		public string UserName { get; set; } = null!;
		public string UserRole { get; set; } = null!;
		public AuditAction Action { get; set; }
		public string EntityName { get; set; } = null!;
		public Guid? EntityId { get; set; }
		public string? OldValue { get; set; }
		public string? NewValue { get; set; }
		public string? Description { get; set; }
		public DateTime DateCreated { get; set; }
	}

	public class CreateAuditLogDto
	{
		public Guid UserId { get; set; }
		public string UserName { get; set; } = null!;
		public string UserRole { get; set; } = null!;
		public AuditAction Action { get; set; }
		public string EntityName { get; set; } = null!;
		public Guid? EntityId { get; set; }
		public string? OldValue { get; set; }
		public string? NewValue { get; set; }
		public string? Description { get; set; }
	}

	public class AuditLogFilterDto : PaginationParams
	{
		public string? UserRole { get; set; }
		public Guid? UserId { get; set; }
		public AuditAction? Action { get; set; }
		public string? EntityName { get; set; }
		public DateTime? FromDate { get; set; }
		public DateTime? ToDate { get; set; }
		public string? SearchTerm { get; set; }
	}
}
