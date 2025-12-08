using Microsoft.AspNetCore.Http;

namespace HSP.Core.Dtos.ChatDto
{
    public class MessageResponseDto
    {
        public Guid Id { get; set; }
        public string? Content { get; set; }
        public Guid SenderId { get; set; }
        public DateTime SentAt { get; set; }
    }
    public class SendMessageRequestDto
    {
        public Guid ConversationId { get; set; }
        public string? Content { get; set; }
    }

    public class MarkMessageReadDto
	{
		public Guid ConversationId { get; set; }
		public Guid UserId { get; set; }
	}
    public class ConversationListDto
    {
        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public Guid TechnicianId { get; set; }
        public string? TechnicianName { get; set; }
        public Guid? BookingId { get; set; }
        public string? BookingDescription { get; set; }
        public MessageResponseDto? LastMessage { get; set; }
        public int UnreadCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsClosed { get; set; }
    }
}