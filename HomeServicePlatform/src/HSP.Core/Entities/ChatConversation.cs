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
		public AppUser Technician { get; set; } = null!;

		public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

		public Guid? LastMessageId { get; set; }
		[ForeignKey(nameof(LastMessageId))]
		public ChatMessage? LastMessage { get; set; }

		public Guid? BookingId { get; set; }
		[ForeignKey(nameof(BookingId))]
		public Booking? Booking { get; set; }
		public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
	}
}
