using HSP.Core.Dtos.ChatDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.DAL.Extensions;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using System.ComponentModel.DataAnnotations;

namespace HSP.Service.Implementations.Internal
{
    public class ChatService : BaseService, IChatService
    {
        private readonly IRepository<ChatConversation, Guid> _conversationRepository;
        private readonly IRepository<ChatMessage, Guid> _messageRepository;
        private readonly IRepository<ChatAttachment, Guid> _attachmentRepository;
        private readonly IRepository<Booking, Guid> _bookingRepository;
        public ChatService(
            IRepository<ChatConversation, Guid> conversationRepository,
            IRepository<ChatMessage, Guid> messageRepository,
            IRepository<ChatAttachment, Guid> attachmentRepository,
            IRepository<Booking, Guid> bookingRepository,
            IUnitOfWork unitOfWork,
            IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
        {
            _conversationRepository = conversationRepository;
            _messageRepository = messageRepository;
            _attachmentRepository = attachmentRepository;
            _bookingRepository = bookingRepository;
        }

        public async Task<Guid> CreateOrGetConversationAsync(CreateChatConversationDto input)
        {
            var existing = await _conversationRepository.GetAll()
            .FirstOrDefaultAsync(x => x.BookingId.Equals(input.BookingId));
            if (existing != null)
                return existing.Id;
            var booking = await _bookingRepository.GetByIdAsync(input.BookingId)
            ?? throw new ValidationException("Booking không tồn tại");
            if (booking.CustomerId != input.UserId &&
                 booking.TechnicianId != input.UserId)
                throw new UnauthorizedAccessException();
            if (booking.TechnicianId == null)
                throw new ValidationException("Booking chưa có kỹ thuật nhận.");
            var newConv = new ChatConversation
            {
                Id = Guid.NewGuid(),
                BookingId = input.BookingId,
                CustomerId = booking.CustomerId,
                TechnicianId = booking.TechnicianId!.Value,
                CreatedAt = DateTime.UtcNow
            };
            await _conversationRepository.AddAsync(newConv);
            await _unitOfWork.SaveChangesAsync();
            return newConv.Id;
        }
        public async Task<List<ConversationListDto>> GetUserConversationsAsync(Guid userId)
        {
            var conversations = await _conversationRepository.GetAll()
                .Include(c => c.Messages)
                .Include(c => c.Customer)
                .Include(c => c.Technician)
                .ThenInclude(t => t.User)
                .Include(c => c.Booking)
                .Where(c => c.CustomerId == userId || c.Technician.UserId == userId)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            var result = conversations.Select(c =>
            {
                var lastMessage = c.Messages
                    .OrderByDescending(m => m.SentAt)
                    .FirstOrDefault();

                var unreadCount = c.Messages
                    .Count(m => !m.IsRead && m.SenderId != userId);

                return new ConversationListDto
                {
                    Id = c.Id,
                    CustomerId = c.CustomerId,
                    CustomerName = c.Customer.FullName,
                    TechnicianId = c.Technician.UserId,
                    TechnicianName = c.Technician.User.FullName,
                    BookingId = c.BookingId,
                    BookingDescription = c.Booking?.ProblemDescription ?? "Không có mô tả",
                    CreatedAt = DateTime.UtcNow,
                    LastMessage = lastMessage == null ? null : new MessageResponseDto
                    {
                        Id = lastMessage.Id,
                        Content = lastMessage.Content,
                        SenderId = lastMessage.SenderId,
                        SentAt = lastMessage.SentAt
                    },
                    UnreadCount = unreadCount
                };
            })
            .ToList();

            return result;
        }

        public async Task<MessageResponseDto> SendMessageAsync(Guid userId, SendMessageRequestDto input)
        {
            var conversation = await _conversationRepository.GetAll()
                    .Include(c => c.Technician)
                    .ThenInclude(t => t.User)
                    .FirstOrDefaultAsync(c => c.Id == input.ConversationId)
                    ?? throw new ValidationException("Conversation không tồn tại");
            if (conversation.CustomerId != userId &&
                conversation.Technician.UserId != userId)
                throw new UnauthorizedAccessException();
            var message = new ChatMessage
            {
                Id = Guid.NewGuid(),
                ConversationId = input.ConversationId,
                SenderId = userId,
                Content = input.Content,
                SentAt = DateTime.UtcNow,
                IsRead = false
            };
            await _messageRepository.AddAsync(message);
            if (input.Attachments != null && input.Attachments.Any())
            {
                foreach (var file in input.Attachments)
                {
                    var attachment = new ChatAttachment
                    {
                        Id = Guid.NewGuid(),
                        MessageId = message.Id,
                        FileName = file.FileName,
                        FileUrl = file.FileUrl,
                        FileSize = file.FileSize,
                        FileType = file.FileType
                    };

                    await _attachmentRepository.AddAsync(attachment);
                }
            }
            conversation.LastMessageId = message.Id;
            await _unitOfWork.SaveChangesAsync();

            return new MessageResponseDto
            {
                Id = message.Id,
                Content = message.Content,
                SenderId = message.SenderId,
                SentAt = message.SentAt,
                Attachments = message.Attachments.Select(a => new AttachmentCreateDto
                {
                    FileUrl = a.FileUrl,
                    FileName = a.FileName,
                    FileSize = a.FileSize
                }).ToList()
            };
        }

        public async Task<List<MessageResponseDto>> GetMessagesAsync(MarkMessageReadDto input)
        {
            var conv = await _conversationRepository.GetAll()
                    .Include(c => c.Technician)
                    .ThenInclude(t => t.User)
                    .FirstOrDefaultAsync(c => c.Id == input.ConversationId)
                    ?? throw new ValidationException("Conversation không tồn tại");

            if (conv.CustomerId != input.UserId &&
                conv.Technician.UserId != input.UserId)
                throw new UnauthorizedAccessException();

            var messages = await _messageRepository.GetAll()
            .Where(x => x.ConversationId == input.ConversationId)
            .Include(x => x.Attachments)
            .OrderBy(x => x.SentAt)
            .Select(x => new MessageResponseDto
            {
                Id = x.Id,
                Content = x.Content,
                SenderId = x.SenderId,
                SentAt = x.SentAt,
                Attachments = x.Attachments.Select(a => new AttachmentCreateDto
                {
                    FileUrl = a.FileUrl,
                    FileName = a.FileName,
                    FileSize = a.FileSize
                }).ToList()
            })
            .ToListAsync();

            var unreadMessages = await _messageRepository.GetAll()
                .Where(x => x.ConversationId == input.ConversationId &&
                            x.SenderId != input.UserId &&
                            !x.IsRead)
                .ToListAsync();

            foreach (var m in unreadMessages)
                m.IsRead = true;

            await _unitOfWork.SaveChangesAsync();

            return messages;
        }
    }
}