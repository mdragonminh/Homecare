using HSP.Core.Dtos.ChatDto;
using HSP.Core.Dtos.Shared;

namespace HSP.Service.Interfaces
{
	public interface IChatService
	{
		Task<Guid> CreateOrGetConversationAsync(CreateChatConversationDto input);
        //Task<List<ChatConversationDto>> GetUserConversationsAsync(Guid userId);
        //Task<List<ChatMessageDto>> GetConversationMessagesAsync(Guid conversationId, Guid currentUserId, PaginationParams? paginationParams = null);
        Task<MessageResponseDto> SendMessageAsync(Guid userId, SendMessageRequestDto input);
        Task<List<MessageResponseDto>> GetMessagesAsync(MarkMessageReadDto input);
        Task<List<ConversationListDto>> GetUserConversationsAsync(Guid userId);
        //Task MarkMessageAsReadAsync(Guid conversationId, Guid messageId, Guid userId);
        //Task<ChatConversationDto?> GetConversationAsync(Guid conversationId, Guid userId);
    }
}