namespace HSP.Core.Dtos.ChatDto
{
	public class ChatMessageDto
	{
		public Guid Id { get; set; }
		public Guid ConversationId { get; set; }
		public Guid SenderId { get; set; }
		public string SenderName { get; set; } = string.Empty;
		public Guid ReceiverId { get; set; }
		public string ReceiverName { get; set; } = string.Empty;
		public string? Content { get; set; }
		public List<ChatAttachmentDto> Attachments { get; set; } = new List<ChatAttachmentDto>();
		public DateTime SentAt { get; set; }
		public bool IsRead { get; set; }
		public bool IsSentByCurrentUser { get; set; }
	}

	public class SendChatMessageDto
	{
		public Guid ConversationId { get; set; }
		public Guid ReceiverId { get; set; }
		public string? Content { get; set; }
		public List<ChatAttachmentCreateDto>? Attachments { get; set; }
	}

	public class MarkMessageReadDto
	{
		public Guid ConversationId { get; set; }
		public Guid MessageId { get; set; }
	}
}