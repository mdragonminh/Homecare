namespace HSP.Core.Dtos.ChatDto
{
	public class ChatConversationDto
	{
		public Guid Id { get; set; }
		public Guid CustomerId { get; set; }
		public string CustomerName { get; set; } = string.Empty;
		public Guid TechnicianId { get; set; }
		public string TechnicianName { get; set; } = string.Empty;
		public DateTime CreatedAt { get; set; }
		public Guid? BookingId { get; set; }
		public string? BookingDescription { get; set; }
		public ChatMessageDto? LastMessage { get; set; }
		public int UnreadCount { get; set; }
	}

	public class CreateChatConversationDto
	{
		public Guid CustomerId { get; set; }
		public Guid TechnicianId { get; set; }
		public Guid? BookingId { get; set; }
	}
}