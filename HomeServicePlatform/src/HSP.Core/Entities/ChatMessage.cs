using HSP.Core.Abstractions.Entity;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
    public class ChatMessage : BaseEntity<Guid>
    {
        public Guid ConversationId { get; set; }
        [ForeignKey(nameof(ConversationId))]
        public ChatConversation Conversation { get; set; } = null!;

        public Guid SenderId { get; set; }
        [ForeignKey(nameof(SenderId))]
        public AppUser Sender { get; set; } = null!;

        public string? Content { get; set; }

        public ICollection<ChatAttachment> Attachments { get; set; } = new List<ChatAttachment>();

        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        public bool IsRead { get; set; }
    }
}
