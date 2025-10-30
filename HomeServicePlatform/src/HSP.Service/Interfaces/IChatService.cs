using HSP.Core.Dtos.ChatDto;

namespace HSP.Service.Interfaces
{
	public interface IChatService
	{
		Task<ChatConversationDto> CreateOrGetConversationAsync(CreateChatConversationDto createDto);
		Task<List<ChatConversationDto>> GetUserConversationsAsync(Guid userId);
		Task<List<ChatMessageDto>> GetConversationMessagesAsync(Guid conversationId, Guid currentUserId, int skip = 0, int take = 50);
		Task<ChatMessageDto> SendMessageAsync(SendChatMessageDto sendDto, Guid senderId);
		Task MarkMessageAsReadAsync(Guid conversationId, Guid messageId, Guid userId);
		Task<ChatConversationDto?> GetConversationAsync(Guid conversationId, Guid userId);
	}
}