using HSP.Core.Abstractions.Entity;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
    public class ChatConversation : BaseEntity<Guid>
    {
        public Guid CustomerId { get; set; }
        [ForeignKey(nameof(CustomerId))]
        public AppUser Customer { get; set; } = null!;
        public Guid TechnicianId { get; set; }
        [ForeignKey(nameof(TechnicianId))]
        public TechnicianProfile Technician { get; set; } = null!;
        public Guid? BookingId { get; set; }
        public Booking? Booking { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public Guid? LastMessageId { get; set; }
        public bool IsClosed { get; set; } = false;
        public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }
}
