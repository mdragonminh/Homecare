using HSP.Core.Dtos.ChatDto;
using HSP.Core.Dtos.Shared;

namespace HSP.Service.Interfaces
{
	public interface IChatService
	{
		Task<ChatConversationDto> CreateOrGetConversationAsync(CreateChatConversationDto createDto);
		Task<List<ChatConversationDto>> GetUserConversationsAsync(Guid userId);
		Task<List<ChatMessageDto>> GetConversationMessagesAsync(Guid conversationId, Guid currentUserId, PaginationParams? paginationParams = null);
		Task<ChatMessageDto> SendMessageAsync(SendChatMessageDto sendDto, Guid senderId);
		Task MarkMessageAsReadAsync(Guid conversationId, Guid messageId, Guid userId);
		Task<ChatConversationDto?> GetConversationAsync(Guid conversationId, Guid userId);
	}
}