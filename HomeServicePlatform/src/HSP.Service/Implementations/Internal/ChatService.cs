using HSP.Core.Constants;
using HSP.Core.Dtos.ChatDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Interfaces;
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
            .Where(c => c.CustomerId == userId || c.Technician.UserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new ConversationListDto
            {
                Id = c.Id,
                CustomerId = c.CustomerId,
                CustomerName = c.Customer.FullName,
                TechnicianId = c.Technician.UserId,
                TechnicianName = c.Technician.User.FullName,
                BookingId = c.BookingId,
                BookingDescription = c.Booking.ProblemDescription ?? "Không có mô tả",
                CreatedAt = c.CreatedAt,

                LastMessage = c.Messages
                    .OrderByDescending(m => m.SentAt)
                    .Select(m => new MessageResponseDto
                    {
                        Id = m.Id,
                        Content = m.Content,
                        SenderId = m.SenderId,
                        SentAt = m.SentAt
                    })
                    .FirstOrDefault(),

                UnreadCount = c.Messages
                    .Count(m => !m.IsRead && m.SenderId != userId)
            })
            .ToListAsync();

            return conversations;
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
            ChatMessage message;
            using (var transaction = await _unitOfWork.BeginTransactionAsync())
            {
                try
                {
                    message = new ChatMessage
                    {
                        ConversationId = input.ConversationId,
                        SenderId = userId,
                        Content = input.Content,
                        SentAt = DateTime.UtcNow,
                        IsRead = false
                    };
                    await _messageRepository.AddAsync(message);

                    if (input.Attachments?.Any() == true)
                    {
                        if (input.Attachments.Count() > 1)
                            throw new ValidationException("Chỉ được gửi tối đa 1 file mỗi tin nhắn.");
                        foreach (var file in input.Attachments)
                        {
                            if (string.IsNullOrWhiteSpace(file.FileUrl))
                                throw new ValidationException("FileUrl không hợp lệ");
                            if (string.IsNullOrWhiteSpace(file.FileName))
                                throw new ValidationException("FileName không hợp lệ");
                            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                            if (!FileConstants.AllowedImageExtensions
                                .Concat(FileConstants.AllowedDocumentExtensions)
                                .Contains(extension))
                                throw new ValidationException($"File '{file.FileName}' không được hỗ trợ.");
                            if (file.FileSize > FileConstants.MaxFileSize)
                                throw new ValidationException($"File '{file.FileName}' vượt quá kích thước cho phép.");
                            await _attachmentRepository.AddAsync(new ChatAttachment
                            {
                                MessageId = message.Id,
                                FileName = file.FileName,
                                FileUrl = file.FileUrl,
                                FileSize = file.FileSize,
                                FileType = file.FileType
                            });
                        }
                    }
                    conversation.LastMessageId = message.Id;
                    await _unitOfWork.SaveChangesAsync();
                    await transaction.CommitAsync();
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            var attachments = await _attachmentRepository.GetAll()
                .Where(a => a.MessageId == message.Id)
                .Select(a => new AttachmentCreateDto
                {
                    FileUrl = a.FileUrl,
                    FileName = a.FileName,
                    FileSize = a.FileSize
                })
                .ToListAsync();
            return new MessageResponseDto
            {
                Id = message.Id,
                Content = message.Content,
                SenderId = message.SenderId,
                SentAt = message.SentAt,
                Attachments = attachments
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

            await _messageRepository.GetAll()
                .Where(x => x.ConversationId == input.ConversationId &&
                            x.SenderId != input.UserId &&
                            !x.IsRead)
                .ExecuteUpdateAsync(set => set.SetProperty(m => m.IsRead, true));


            await _unitOfWork.SaveChangesAsync();

            return messages;
        }
    }
}