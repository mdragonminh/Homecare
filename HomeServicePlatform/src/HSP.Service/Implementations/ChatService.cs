using HSP.Core.Dtos.ChatDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HSP.Service.Implementations
{
	public class ChatService : IChatService
	{
		private readonly IRepository<ChatConversation, Guid> _conversationRepository;
		private readonly IRepository<ChatMessage, Guid> _messageRepository;
		private readonly IRepository<ChatAttachment, Guid> _attachmentRepository;
		private readonly IUserRepository _userRepository;
		private readonly IUnitOfWork _unitOfWork;

		public ChatService(
			IRepository<ChatConversation, Guid> conversationRepository,
			IRepository<ChatMessage, Guid> messageRepository, 
			IRepository<ChatAttachment, Guid> attachmentRepository,
			IUserRepository userRepository,
			IUnitOfWork unitOfWork)
		{
			_conversationRepository = conversationRepository;
			_messageRepository = messageRepository;
			_attachmentRepository = attachmentRepository;
			_userRepository = userRepository;
			_unitOfWork = unitOfWork;
		}

		public async Task<ChatConversationDto> CreateOrGetConversationAsync(CreateChatConversationDto createDto)
		{
			// Tìm conversation existing
			var existingConversation = await _conversationRepository.GetAll()
				.Where(c => c.CustomerId == createDto.CustomerId && c.TechnicianId == createDto.TechnicianId)
				.Include(c => c.Customer)
				.Include(c => c.Technician)
				.Include(c => c.Booking)
				.FirstOrDefaultAsync();

			if (existingConversation != null)
			{
				return MapConversationToDto(existingConversation, createDto.CustomerId);
			}

			var newConversation = new ChatConversation
			{
				Id = Guid.NewGuid(),
				CustomerId = createDto.CustomerId,
				TechnicianId = createDto.TechnicianId,
				BookingId = createDto.BookingId
			};

			await _conversationRepository.AddAsync(newConversation);
			await _unitOfWork.SaveChangesAsync();

			var createdConversation = await _conversationRepository.GetAll()
				.Where(c => c.Id == newConversation.Id)
				.Include(c => c.Customer)
				.Include(c => c.Technician)
				.Include(c => c.Booking)
				.FirstOrDefaultAsync();
				
			return MapConversationToDto(createdConversation!, createDto.CustomerId);
		}

		public async Task<List<ChatConversationDto>> GetUserConversationsAsync(Guid userId)
		{
			var conversations = await _conversationRepository.GetAll()
				.Where(c => c.CustomerId == userId || c.TechnicianId == userId)
				.Include(c => c.Customer)
				.Include(c => c.Technician)
				.Include(c => c.Booking)
				.ToListAsync();
				
			var conversationDtos = new List<ChatConversationDto>();

			foreach (var conversation in conversations)
			{
				var dto = MapConversationToDto(conversation, userId);
				conversationDtos.Add(dto);
			}

			return conversationDtos;
		}

		public async Task<List<ChatMessageDto>> GetConversationMessagesAsync(Guid conversationId, Guid currentUserId, int skip = 0, int take = 50)
		{
			var messages = await _messageRepository.GetAll()
				.Where(m => m.ConversationId == conversationId)
				.Include(m => m.Sender)
				.Include(m => m.Attachments)
				.OrderByDescending(m => m.SentAt)
				.Skip(skip)
				.Take(take)
				.ToListAsync();
			
			return messages.Select(m => MapMessageToDto(m)).ToList();
		}

		public async Task<ChatMessageDto> SendMessageAsync(SendChatMessageDto sendDto, Guid senderId)
		{
			var message = new ChatMessage
			{
				Id = Guid.NewGuid(),
				ConversationId = sendDto.ConversationId,
				SenderId = senderId,
				ReceiverId = sendDto.ReceiverId,
				Content = sendDto.Content,
				SentAt = DateTime.UtcNow,
				IsRead = false
			};

			await _messageRepository.AddAsync(message);

			if (sendDto.Attachments?.Any() == true)
			{
				foreach (var attachmentDto in sendDto.Attachments)
				{
					var attachment = new ChatAttachment
					{
						Id = Guid.NewGuid(),
						MessageId = message.Id,
						FileName = attachmentDto.FileName,
						FileUrl = attachmentDto.FileUrl,
						FileType = attachmentDto.FileType,
						FileSize = attachmentDto.FileSize
					};
					await _attachmentRepository.AddAsync(attachment);
				}
			}

			await _unitOfWork.SaveChangesAsync();

			var savedMessage = await _messageRepository.GetAll()
				.Where(m => m.Id == message.Id)
				.Include(m => m.Sender)
				.Include(m => m.Attachments)
				.FirstOrDefaultAsync();

			return MapMessageToDto(savedMessage!);
		}

		public async Task MarkMessageAsReadAsync(Guid conversationId, Guid messageId, Guid userId)
		{
			var message = await _messageRepository.GetByIdAsync(messageId);
			if (message != null)
			{
				message.IsRead = true;
				_messageRepository.Update(message);
				await _unitOfWork.SaveChangesAsync();
			}
		}

		public async Task<ChatConversationDto?> GetConversationAsync(Guid conversationId, Guid userId)
		{
			var conversation = await _conversationRepository.GetAll()
				.Where(c => c.Id == conversationId)
				.Include(c => c.Customer)
				.Include(c => c.Technician)
				.Include(c => c.Booking)
				.FirstOrDefaultAsync();

			if (conversation == null)
				return null;

			return MapConversationToDto(conversation, userId);
		}

		private ChatConversationDto MapConversationToDto(ChatConversation conversation, Guid currentUserId)
		{
			return new ChatConversationDto
			{
				Id = conversation.Id,
				CustomerId = conversation.CustomerId,
				TechnicianId = conversation.TechnicianId,
				BookingId = conversation.BookingId,
				CustomerName = conversation.Customer?.FullName ?? "",
				TechnicianName = conversation.Technician?.FullName ?? "",
				BookingDescription = conversation.Booking?.ProblemDescription ?? "",
				LastMessage = null,
				CreatedAt = DateTime.UtcNow,
				UnreadCount = 0
			};
		}

		private ChatMessageDto MapMessageToDto(ChatMessage message)
		{
			return new ChatMessageDto
			{
				Id = message.Id,
				ConversationId = message.ConversationId,
				SenderId = message.SenderId,
				SenderName = message.Sender?.FullName ?? "",
				ReceiverId = message.ReceiverId,
				Content = message.Content ?? "",
				SentAt = message.SentAt,
				IsRead = message.IsRead,
				Attachments = message.Attachments?.Select(a => new ChatAttachmentDto
				{
					Id = a.Id,
					MessageId = a.MessageId,
					FileName = a.FileName,
					FileUrl = a.FileUrl,
					FileType = a.FileType,
					FileSize = a.FileSize
				}).ToList() ?? new List<ChatAttachmentDto>()
			};
		}
	}
}