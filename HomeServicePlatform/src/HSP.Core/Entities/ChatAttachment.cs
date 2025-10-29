using HSP.Core.Abstractions.Entity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
	public class ChatAttachment : BaseEntity<Guid>
	{
		[Required]
		public Guid MessageId { get; set; }
		[ForeignKey(nameof(MessageId))]
		public ChatMessage Message { get; set; } = null!;

		[Required, MaxLength(255)]
		public string FileName { get; set; } = string.Empty;

		[Required, MaxLength(500)]
		public string FileUrl { get; set; } = string.Empty;

		[MaxLength(100)]
		public string? FileType { get; set; } 

		public long FileSize { get; set; } 
	}
}
