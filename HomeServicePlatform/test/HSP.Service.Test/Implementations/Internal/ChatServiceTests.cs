using HSP.Core.Dtos.ChatDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Implementations.Internal;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Localization;
using MockQueryable.Moq;
using Moq;
using System.ComponentModel.DataAnnotations;

namespace HSP.Service.Test.Implementations.Internal
{
    public class ChatServiceTests
    {
        private readonly Mock<IRepository<ChatConversation, Guid>> _conversationRepo;
        private readonly Mock<IRepository<ChatMessage, Guid>> _messageRepo;
        private readonly Mock<IRepository<Booking, Guid>> _bookingRepo;
        private readonly Mock<IUnitOfWork> _unitOfWork;
        private readonly Mock<IStringLocalizer<SharedResource>> _localizer;
        private readonly ChatService _chatService;
        public ChatServiceTests()
        {
            _conversationRepo = new Mock<IRepository<ChatConversation, Guid>>();
            _messageRepo = new Mock<IRepository<ChatMessage, Guid>>();
            _bookingRepo = new Mock<IRepository<Booking, Guid>>();
            _unitOfWork = new Mock<IUnitOfWork>();
            _localizer = new Mock<IStringLocalizer<SharedResource>>();

            _chatService = new ChatService(
                _conversationRepo.Object,
                _messageRepo.Object,
                _bookingRepo.Object,
                _unitOfWork.Object,
                _localizer.Object
            );
        }
        [Fact]
        public async Task CreateOrGetConversation_ShouldReturnExisting()
        {
            var conv = new ChatConversation { Id = Guid.NewGuid(), BookingId = Guid.NewGuid() };

            _conversationRepo.Setup(r => r.GetAll())
                .Returns(new List<ChatConversation> { conv }.BuildMockDbSet().Object);

            var result = await _chatService.CreateOrGetConversationAsync(new CreateChatConversationDto
            {
                BookingId = (Guid)conv.BookingId,
                UserId = Guid.NewGuid()
            });

            Assert.Equal(conv.Id, result);
        }
        [Fact]
        public async Task CreateOrGetConversation_ShouldCreateNew()
        {
            var booking = new Booking { Id = Guid.NewGuid(), CustomerId = Guid.NewGuid(), TechnicianId = Guid.NewGuid() };

            _conversationRepo.Setup(r => r.GetAll())
                .Returns(new List<ChatConversation>().BuildMockDbSet().Object);

            _bookingRepo.Setup(r => r.GetByIdAsync(booking.Id))
                .ReturnsAsync(booking);

            Guid savedId = Guid.Empty;

            _conversationRepo.Setup(r => r.AddAsync(It.IsAny<ChatConversation>()))
             .Callback<ChatConversation>(c => savedId = c.Id)
             .Returns<ChatConversation>(c => Task.FromResult(c));

            _unitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var result = await _chatService.CreateOrGetConversationAsync(new CreateChatConversationDto
            {
                BookingId = booking.Id,
                UserId = booking.CustomerId
            });

            Assert.Equal(savedId, result);
        }
        [Fact]
        public async Task CreateOrGetConversation_ShouldThrow_WhenBookingNotFound()
        {
            _conversationRepo.Setup(r => r.GetAll())
                .Returns(new List<ChatConversation>().BuildMockDbSet().Object);

            _bookingRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((Booking?)null);

            await Assert.ThrowsAsync<ValidationException>(async () =>
                await _chatService.CreateOrGetConversationAsync(new CreateChatConversationDto
                {
                    BookingId = Guid.NewGuid(),
                    UserId = Guid.NewGuid()
                }));
        }
        [Fact]
        public async Task GetUserConversations_ReturnsConversationList()
        {
            var userId = Guid.NewGuid();

            var conv = new ChatConversation
            {
                Id = Guid.NewGuid(),
                CustomerId = userId,
                Customer = new AppUser { FullName = "Customer A" },  

                Technician = new TechnicianProfile
                {
                    UserId = Guid.NewGuid(),
                    User = new AppUser { FullName = "Tech" }
                },

                Booking = new Booking { ProblemDescription = "Fix AC" },

                Messages = new List<ChatMessage>
                {
                    new ChatMessage
                    {
                        Id = Guid.NewGuid(),
                        SenderId = userId,
                        Content = "Hi",
                        SentAt = DateTime.UtcNow
                    }
                }
            };

            _conversationRepo.Setup(r => r.GetAll())
                .Returns(new List<ChatConversation> { conv }.BuildMockDbSet().Object);

            var result = await _chatService.GetUserConversationsAsync(userId);

            Assert.Single(result);
            Assert.Equal("Fix AC", result[0].BookingDescription);
            Assert.NotNull(result[0].LastMessage);
            Assert.Equal("Customer A", result[0].CustomerName);
            Assert.Equal("Tech", result[0].TechnicianName);
        }

        [Fact]
        public async Task SendMessageAsync_ShouldSaveMessageAndAttachments()
        {
            var userId = Guid.NewGuid();

            var conv = new ChatConversation
            {
                Id = Guid.NewGuid(),
                CustomerId = userId,
                TechnicianId = Guid.NewGuid(),
                Technician = new TechnicianProfile
                {
                    UserId = Guid.NewGuid(),
                    User = new AppUser { FullName = "Tech" }   
                },
                BookingId = Guid.NewGuid(),
                Booking = new Booking()
            };

            _conversationRepo.Setup(r => r.GetAll())
                .Returns(new List<ChatConversation> { conv }.BuildMockDbSet().Object);

            ChatMessage? savedMsg = null;

            _messageRepo.Setup(r => r.AddAsync(It.IsAny<ChatMessage>()))
                .Callback<ChatMessage>(m => savedMsg = m)
                .ReturnsAsync((ChatMessage m) => m);


            var mockTx = new Mock<Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction>();
            _unitOfWork.Setup(u => u.BeginTransactionAsync()).ReturnsAsync(mockTx.Object);

            _unitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var dto = new SendMessageRequestDto
            {
                ConversationId = conv.Id,
                Content = "Hello",
            };

            var result = await _chatService.SendMessageAsync(userId, dto);

            Assert.NotNull(savedMsg);
            Assert.Equal("Hello", result.Content);
        }

        [Fact]
        public async Task GetMessagesAsync_ShouldReturnMessages_AndMarkRead()
        {
            var convId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var conv = new ChatConversation
            {
                Id = convId,
                CustomerId = userId,
                Technician = new TechnicianProfile { UserId = Guid.NewGuid(), User = new AppUser() }
            };

            _conversationRepo.Setup(r => r.GetAll())
                .Returns(new List<ChatConversation> { conv }.BuildMockDbSet().Object);

            var msgs = new List<ChatMessage>
            {
                new ChatMessage { Id = Guid.NewGuid(), ConversationId = convId, SenderId = Guid.NewGuid(), Content="A", SentAt=DateTime.UtcNow, IsRead=false }
            };

            _messageRepo.Setup(r => r.GetAll())
                .Returns(msgs.BuildMockDbSet().Object);

            var result = await _chatService.GetMessagesAsync(new MarkMessageReadDto
            {
                ConversationId = convId,
                UserId = userId
            });

            Assert.Single(result);
        }
        [Fact]
        public async Task CreateOrGetConversation_ShouldThrow_WhenUserUnauthorized()
        {
            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                CustomerId = Guid.NewGuid(),
                TechnicianId = Guid.NewGuid()
            };

            _conversationRepo.Setup(r => r.GetAll())
                .Returns(new List<ChatConversation>().BuildMockDbSet().Object);

            _bookingRepo.Setup(r => r.GetByIdAsync(booking.Id))
                .ReturnsAsync(booking);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _chatService.CreateOrGetConversationAsync(new CreateChatConversationDto
                {
                    BookingId = booking.Id,
                    UserId = Guid.NewGuid()  
                }));
        }
        [Fact]
        public async Task CreateOrGetConversation_ShouldThrow_WhenTechnicianIsNull()
        {
            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                CustomerId = Guid.NewGuid(),
                TechnicianId = null
            };

            _conversationRepo.Setup(r => r.GetAll())
                .Returns(new List<ChatConversation>().BuildMockDbSet().Object);

            _bookingRepo.Setup(r => r.GetByIdAsync(booking.Id))
                .ReturnsAsync(booking);

            await Assert.ThrowsAsync<ValidationException>(() =>
                _chatService.CreateOrGetConversationAsync(new CreateChatConversationDto
                {
                    BookingId = booking.Id,
                    UserId = booking.CustomerId
                }));
        }
        [Fact]
        public async Task SendMessageAsync_ShouldThrow_WhenUnauthorized()
        {
            var conv = new ChatConversation
            {
                Id = Guid.NewGuid(),
                CustomerId = Guid.NewGuid(),
                Technician = new TechnicianProfile
                {
                    UserId = Guid.NewGuid(),
                    User = new AppUser()
                }
            };

            _conversationRepo.Setup(r => r.GetAll())
                .Returns(new List<ChatConversation> { conv }.BuildMockDbSet().Object);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _chatService.SendMessageAsync(Guid.NewGuid(), new SendMessageRequestDto
                {
                    ConversationId = conv.Id,
                    Content = "test"
                }));
        }
        [Fact]
        public async Task SendMessageAsync_ShouldSaveAttachments_WhenProvided()
        {
            var userId = Guid.NewGuid();

            var conv = new ChatConversation
            {
                Id = Guid.NewGuid(),
                CustomerId = userId,
                Technician = new TechnicianProfile { UserId = userId, User = new AppUser() }
            };

            _conversationRepo.Setup(r => r.GetAll())
                .Returns(new List<ChatConversation> { conv }.BuildMockDbSet().Object);


         
            _messageRepo.Setup(r => r.AddAsync(It.IsAny<ChatMessage>()))
                .ReturnsAsync((ChatMessage c)=>c);

            var mockTx = new Mock<IDbContextTransaction>();
            _unitOfWork.Setup(_ => _.BeginTransactionAsync()).ReturnsAsync(mockTx.Object);
            _unitOfWork.Setup(_ => _.SaveChangesAsync()).ReturnsAsync(1);

            var dto = new SendMessageRequestDto
            {
                ConversationId = conv.Id,
                Content = "hello",
               
            };

            await _chatService.SendMessageAsync(userId, dto);
        }

        [Fact]
        public async Task GetMessagesAsync_ShouldThrow_WhenUnauthorized()
        {
            var conv = new ChatConversation
            {
                Id = Guid.NewGuid(),
                CustomerId = Guid.NewGuid(),
                Technician = new TechnicianProfile { UserId = Guid.NewGuid(), User = new AppUser() }
            };

            _conversationRepo.Setup(r => r.GetAll())
                .Returns(new List<ChatConversation> { conv }.BuildMockDbSet().Object);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _chatService.GetMessagesAsync(new MarkMessageReadDto
                {
                    ConversationId = conv.Id,
                    UserId = Guid.NewGuid() 
                }));
        }
        [Fact]
        public async Task GetMessagesAsync_ShouldReturnEmpty_WhenNoMessages()
        {
            var convId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var conv = new ChatConversation
            {
                Id = convId,
                CustomerId = userId,
                Technician = new TechnicianProfile { UserId = Guid.NewGuid(), User = new AppUser() }
            };

            _conversationRepo.Setup(r => r.GetAll())
                .Returns(new List<ChatConversation> { conv }.BuildMockDbSet().Object);

            _messageRepo.Setup(r => r.GetAll())
                .Returns(new List<ChatMessage>().BuildMockDbSet().Object);

            var result = await _chatService.GetMessagesAsync(new MarkMessageReadDto
            {
                ConversationId = convId,
                UserId = userId
            });

            Assert.Empty(result);
        }
        

    }
}
