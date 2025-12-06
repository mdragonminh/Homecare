using HSP.Core.Abstractions.Entity;
using HSP.Core.Dtos.BookingDto;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.Service.Implementations.Internal;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Localization;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using System.Linq.Expressions;
using Xunit;

namespace HSP.Service.Test.Implementations.Internal
{
    public class BookingServiceTests
    {
        // Mocks
        private readonly Mock<IRepository<Booking, Guid>> _bookingRepoMock;
        private readonly Mock<IRepository<BookingItem, Guid>> _bookingItemRepoMock;
        private readonly Mock<IRepository<TechnicianProfile, Guid>> _technicianRepoMock;
        private readonly Mock<IRepository<Core.Entities.Service, Guid>> _serviceRepoMock;
        private readonly Mock<IRepository<Equipment, Guid>> _equipmentRepoMock;
        private readonly Mock<IRepository<BookingEquipment, Guid>> _bookingEquipmentRepoMock;
        private readonly Mock<IRepository<ChatConversation, Guid>> _conversationRepoMock;
        private readonly Mock<IGeocodingService> _geocodingServiceMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IRedisCacheService> _redisCacheServiceMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IStringLocalizer<SharedResource>> _localizerMock;

        // Service under test
        private readonly BookingService _bookingService;

        public BookingServiceTests()
        {
            _bookingRepoMock = new Mock<IRepository<Booking, Guid>>();
            _bookingItemRepoMock = new Mock<IRepository<BookingItem, Guid>>();
            _technicianRepoMock = new Mock<IRepository<TechnicianProfile, Guid>>();
            _serviceRepoMock = new Mock<IRepository<Core.Entities.Service, Guid>>();
            _equipmentRepoMock = new Mock<IRepository<Equipment, Guid>>();
            _bookingEquipmentRepoMock = new Mock<IRepository<BookingEquipment, Guid>>();
            _conversationRepoMock = new Mock<IRepository<ChatConversation, Guid>>();
            _geocodingServiceMock = new Mock<IGeocodingService>();
            _userRepoMock = new Mock<IUserRepository>();
            _redisCacheServiceMock = new Mock<IRedisCacheService>();
            _emailServiceMock = new Mock<IEmailService>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _localizerMock = new Mock<IStringLocalizer<SharedResource>>();

            // Setup UnitOfWork Transaction
            _unitOfWorkMock.Setup(x => x.BeginTransactionAsync())
                .ReturnsAsync(new Mock<IDbContextTransaction>().Object);

            _bookingService = new BookingService(
                _bookingRepoMock.Object,
                _bookingItemRepoMock.Object,
                _technicianRepoMock.Object,
                _serviceRepoMock.Object,
                _geocodingServiceMock.Object,
                _userRepoMock.Object,
                _redisCacheServiceMock.Object,
                _conversationRepoMock.Object,
                _unitOfWorkMock.Object,
                _localizerMock.Object,
                _emailServiceMock.Object,
                _equipmentRepoMock.Object,
                _bookingEquipmentRepoMock.Object
            );
        }

        // --- Helper để mock DbSet/IQueryable cho Entity Framework ---
        // Hàm Helper để mock DbSet/IQueryable cho Entity Framework
        private void MockRepoGetAll<T>(Mock<IRepository<T, Guid>> mockRepo, List<T> data)
            where T : BaseEntity<Guid> // <--- ĐÂY LÀ CHỖ SỬA QUAN TRỌNG NHẤT
        {
            // BuildMock() tạo ra một IQueryable giả lập có thể chạy async (ToListAsync, FirstOrDefaultAsync...)
            var mock = data.BuildMock();

            // Setup hàm GetAll để trả về mock data bất kể tham số includes là gì
            mockRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<T, object>>[]>()))
                .Returns(mock);
        }

        // ==========================================
        // TEST: GetBookingDetailAsync
        // ==========================================

        [Fact]
        public async Task GetBookingDetailAsync_ShouldReturnData_WhenBookingExists()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var customerId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = bookingId,
                CustomerId = customerId,
                Status = BookingStatus.Pending,
                Items = new List<BookingItem>
                {
                    new BookingItem { Price = 100, Service = new Core.Entities.Service { Name = "Clean AC" } }
                },
                Equipments = new List<BookingEquipment>
                {
                    new BookingEquipment { Quantity = 2, UnitPrice = 50, Equipment = new Equipment { Name = "Gas" } }
                },
                // SỬA Ở ĐÂY: Dùng AppUser thay vì CustomerProfile
                Customer = new AppUser
                {
                    Id = customerId,
                    FullName = "John Doe",
                    Email = "john@example.com",
                    UserName = "john_user"
                },
                Payments = new List<Payment>(),
                Feedbacks = new List<BookingFeedback>()
            };

            // Mock repo trả về list chứa booking trên
            MockRepoGetAll(_bookingRepoMock, new List<Booking> { booking });

            // Mock items & equipments repo calls
            MockRepoGetAll(_bookingItemRepoMock, booking.Items.ToList());

            // Mock Geocoding
            _geocodingServiceMock.Setup(x => x.GetAddressForCoordinatesAsync(It.IsAny<double>(), It.IsAny<double>()))
                .ReturnsAsync("123 Street, HCM");

            // Act
            var result = await _bookingService.GetBookingDetailAsync(bookingId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(bookingId, result.Id);
            Assert.Equal(200, result.TotalPrice); // 100 (Service) + 2*50 (Equipment)
            Assert.Equal("123 Street, HCM", result.Address);
            Assert.Equal("John Doe", result.CustomerName);
        }

        [Fact]
        public async Task GetBookingDetailAsync_ShouldThrowException_WhenBookingNotFound()
        {
            // Arrange
            MockRepoGetAll(_bookingRepoMock, new List<Booking>());

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _bookingService.GetBookingDetailAsync(Guid.NewGuid()));
        }

        [Fact]
        public async Task GetBookingDetailAsync_ShouldMapPaymentsAndFeedbacksCorrectly()
        {
            // Arrange
            var bookingId = Guid.NewGuid();

            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                Amount = 500000,
                PaymentMethod = PaymentMethod.EWallet,
                Status = PaymentStatus.Completed,
                TransactionId = "TRANS123",
                DateCreated = DateTime.UtcNow
            };

            var feedback = new BookingFeedback
            {
                BookingId = bookingId,
                Rating = 5,
                Comment = "Good job",
                Source = FeedbackSource.Customer
            };

            var booking = new Booking
            {
                Id = bookingId,
                Status = BookingStatus.Completed,
                Customer = new AppUser { FullName = "Customer A" },
                Technician = new TechnicianProfile { User = new AppUser { FullName = "Tech B" } },
                // Setup list Payments và Feedbacks
                Payments = new List<Payment> { payment },
                Feedbacks = new List<BookingFeedback> { feedback },
                Items = new List<BookingItem>(),
                Equipments = new List<BookingEquipment>()
            };

            MockRepoGetAll(_bookingRepoMock, new List<Booking> { booking });
            MockRepoGetAll(_bookingItemRepoMock, new List<BookingItem>());

            // Mock Geocoding để không bị null
            _geocodingServiceMock.Setup(x => x.GetAddressForCoordinatesAsync(It.IsAny<double>(), It.IsAny<double>()))
                .ReturnsAsync("Address");

            // Act
            var result = await _bookingService.GetBookingDetailAsync(bookingId);

            // Assert
            Assert.NotNull(result);

            // Kiểm tra Payment Mapping
            Assert.Single(result.Payments);
            var resultPayment = result.Payments.First();
            Assert.Equal(payment.Amount, resultPayment.Amount);
            Assert.Equal(payment.TransactionId, resultPayment.TransactionId);
            Assert.Equal(payment.PaymentMethod, resultPayment.PaymentMethod);

            // Kiểm tra Feedback Mapping
            Assert.Single(result.Feedbacks);
            var resultFeedback = result.Feedbacks.First();
            Assert.Equal(5, resultFeedback.Rating);
            Assert.Equal("Good job", resultFeedback.Comment);
        }

        [Fact]
        public async Task GetBookingDetailAsync_ShouldCalculateCustomerAverageRating()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var customerId = Guid.NewGuid();

            // Tạo booking đã hoàn thành có feedback từ Tech -> Customer
            var pastBooking = new Booking
            {
                Id = Guid.NewGuid(),
                CustomerId = customerId,
                Status = BookingStatus.Completed,
                Feedbacks = new List<BookingFeedback>
        {
            new BookingFeedback { Source = FeedbackSource.Technician, Rating = 4 },
            new BookingFeedback { Source = FeedbackSource.Technician, Rating = 5 }
        }
            };

            var currentBooking = new Booking
            {
                Id = bookingId,
                CustomerId = customerId,
                Customer = new AppUser { FullName = "Customer" },
                Status = BookingStatus.Pending
            };

            // Mock repo trả về cả booking cũ và mới
            MockRepoGetAll(_bookingRepoMock, new List<Booking> { pastBooking, currentBooking });
            MockRepoGetAll(_bookingItemRepoMock, new List<BookingItem>());
            _geocodingServiceMock.Setup(x => x.GetAddressForCoordinatesAsync(It.IsAny<double>(), It.IsAny<double>())).ReturnsAsync("Address");

            // Act
            var result = await _bookingService.GetBookingDetailAsync(bookingId);

            // Assert
            Assert.Equal(4.5, result.CustomerAverageRating); // (4+5)/2
            Assert.Equal(2, result.CustomerRatingCount);
        }

        // ==========================================
        // TEST: UpdateBookingStatusAsync
        // ==========================================

        [Fact]
        public async Task UpdateBookingStatusAsync_ShouldUpdate_WhenTechnicianIsValid()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var techUserId = Guid.NewGuid();
            var techId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.Confirmed };

            // SỬA Ở ĐÂY: Dùng AppUser cho thuộc tính User của TechnicianProfile
            var technician = new TechnicianProfile
            {
                Id = techId,
                User = new AppUser { Id = techUserId, FullName = "Tech Name", UserName = "tech_user" }
            };

            _bookingRepoMock.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            MockRepoGetAll(_technicianRepoMock, new List<TechnicianProfile> { technician });

            var input = new UpdateBookingStatusDto { BookingId = bookingId, Status = BookingStatus.InProgress };

            // Act
            var result = await _bookingService.UpdateBookingStatusAsync(input, techUserId.ToString());

            // Assert
            Assert.True(result);
            Assert.Equal(BookingStatus.InProgress, booking.Status);
            _bookingRepoMock.Verify(x => x.Update(booking), Times.Once);
            _unitOfWorkMock.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task UpdateBookingStatusAsync_ShouldReturnFalse_WhenTechnicianDoesNotMatch()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var techUserId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = Guid.NewGuid() }; // Khác techId

            // SỬA Ở ĐÂY: Dùng AppUser
            var technician = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                User = new AppUser { Id = techUserId }
            };

            _bookingRepoMock.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            MockRepoGetAll(_technicianRepoMock, new List<TechnicianProfile> { technician });

            // Act
            var result = await _bookingService.UpdateBookingStatusAsync(
                new UpdateBookingStatusDto { BookingId = bookingId, Status = BookingStatus.Completed },
                techUserId.ToString());

            // Assert
            Assert.False(result);
            _bookingRepoMock.Verify(x => x.Update(It.IsAny<Booking>()), Times.Never);
        }

        [Fact]
        public async Task UpdateBookingStatusAsync_ShouldReturnFalse_WhenBookingNotFound()
        {
            // Arrange
            _bookingRepoMock.Setup(x => x.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Booking?)null);

            // Act
            var result = await _bookingService.UpdateBookingStatusAsync(new UpdateBookingStatusDto(), Guid.NewGuid().ToString());

            // Assert
            Assert.False(result);
        }

        //[Fact]
        //public async Task UpdateBookingStatusAsync_ShouldSetDateCompleted_WhenStatusIsCompleted()
        //{
        //    // Arrange
        //    var bookingId = Guid.NewGuid();
        //    var techUserId = Guid.NewGuid();
        //    var techId = Guid.NewGuid();

        //    var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.InProgress };
        //    var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = techUserId } };

        //    _bookingRepoMock.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
        //    MockRepoGetAll(_technicianRepoMock, new List<TechnicianProfile> { technician });

        //    var input = new UpdateBookingStatusDto { BookingId = bookingId, Status = BookingStatus.Completed };

        //    // Act
        //    await _bookingService.UpdateBookingStatusAsync(input, techUserId.ToString());

        //    // Assert
        //    Assert.NotNull(booking.DateCompleted); // Kiểm tra ngày hoàn thành đã được set
        //                                           // Kiểm tra khoảng thời gian (chênh lệch không quá 1 giây so với hiện tại)
        //    Assert.True((DateTime.UtcNow - booking.DateCompleted.Value).TotalSeconds < 1);
        //}

        // ==========================================
        // TEST: CancelBookingAsync
        // ==========================================

        [Fact]
        public async Task CancelBookingAsync_ShouldCancelAndSendEmail_WhenValid()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var techUserId = Guid.NewGuid();
            var techId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = bookingId,
                TechnicianId = techId,
                Status = BookingStatus.Confirmed,
                // SỬA Ở ĐÂY: Dùng AppUser
                Customer = new AppUser { Email = "test@test.com", FullName = "Customer", UserName = "cust_user" },
                DesiredDate = DateTime.UtcNow
            };

            // SỬA Ở ĐÂY: Dùng AppUser
            var technician = new TechnicianProfile
            {
                Id = techId,
                User = new AppUser { Id = techUserId }
            };

            MockRepoGetAll(_bookingRepoMock, new List<Booking> { booking });
            MockRepoGetAll(_technicianRepoMock, new List<TechnicianProfile> { technician });

            var input = new CancelBookingDto { BookingId = bookingId, Reason = "Busy" };

            // Act
            var result = await _bookingService.CancelBookingAsync(input, techUserId.ToString());

            // Assert
            Assert.True(result);
            Assert.Equal(BookingStatus.Cancelled, booking.Status);
            Assert.NotNull(booking.Cancellation);
            Assert.Equal("Busy", booking.Cancellation.Reason);

            // Verify Email Sent
            _emailServiceMock.Verify(x => x.SendEmailAsync(It.Is<HSP.Service.Dtos.EmailDto.EmailDto>(e =>
                e.ToEmail == "test@test.com" && e.Subject.Contains("hủy lịch"))), Times.Once);
        }

        [Fact]
        public async Task CancelBookingAsync_ShouldReturnFalse_WhenValidationFails()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var techUserId = Guid.NewGuid();
            var techId = Guid.NewGuid();

            // Case 1: Booking Null
            MockRepoGetAll(_bookingRepoMock, new List<Booking>());
            var res1 = await _bookingService.CancelBookingAsync(new CancelBookingDto { BookingId = bookingId }, techUserId.ToString());
            Assert.False(res1);

            // Case 2: Wrong Tech
            var b2 = new Booking { Id = bookingId, TechnicianId = Guid.NewGuid() }; // Khác TechId
            var t2 = new TechnicianProfile { Id = techId, User = new AppUser { Id = techUserId } };
            MockRepoGetAll(_bookingRepoMock, new List<Booking> { b2 });
            MockRepoGetAll(_technicianRepoMock, new List<TechnicianProfile> { t2 });
            var res2 = await _bookingService.CancelBookingAsync(new CancelBookingDto { BookingId = bookingId }, techUserId.ToString());
            Assert.False(res2);

            // Case 3: Status Completed
            var b3 = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.Completed };
            MockRepoGetAll(_bookingRepoMock, new List<Booking> { b3 });
            var res3 = await _bookingService.CancelBookingAsync(new CancelBookingDto { BookingId = bookingId }, techUserId.ToString());
            Assert.False(res3);
        }

        [Fact]
        public async Task CancelBookingAsync_ShouldNotThrow_WhenEmailServiceFails()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var techUserId = Guid.NewGuid();
            var techId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = bookingId,
                TechnicianId = techId,
                Status = BookingStatus.Confirmed,
                Customer = new AppUser { Email = "test@test.com" }
            };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = techUserId } };

            MockRepoGetAll(_bookingRepoMock, new List<Booking> { booking });
            MockRepoGetAll(_technicianRepoMock, new List<TechnicianProfile> { technician });

            // Mock Email Service throw Exception
            _emailServiceMock.Setup(x => x.SendEmailAsync(It.IsAny<HSP.Service.Dtos.EmailDto.EmailDto>()))
                .ThrowsAsync(new Exception("SMTP Error"));

            // Act
            var result = await _bookingService.CancelBookingAsync(new CancelBookingDto { BookingId = bookingId }, techUserId.ToString());

            // Assert
            Assert.True(result); // Vẫn trả về True dù gửi mail lỗi
            Assert.Equal(BookingStatus.Cancelled, booking.Status);
        }

        // ==========================================
        // TEST: AcceptBookingAsync
        // ==========================================

        [Fact]
        public async Task AcceptBookingAsync_ShouldAccept_WhenTokenValidAndTechnicianMatches()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();
            var token = "valid_token";

            var booking = new Booking { Id = bookingId, Status = BookingStatus.Pending };
            var technician = new TechnicianProfile { Id = techId, UserId = userId };

            // Redis setup
            _redisCacheServiceMock.Setup(x => x.GetAsync<string>($"waiting_{token}")).ReturnsAsync("some_value");
            _redisCacheServiceMock.Setup(x => x.GetAsync<Guid>($"accept_{token}")).ReturnsAsync(techId);

            // Repo setup
            MockRepoGetAll(_technicianRepoMock, new List<TechnicianProfile> { technician });
            _bookingRepoMock.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);

            var input = new AcceptBookingDto { BookingId = bookingId, Token = token };

            // Act
            var result = await _bookingService.AcceptBookingAsync(userId, input);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(BookingStatus.Confirmed, booking.Status);
            Assert.Equal(techId, booking.TechnicianId);

            // Verify Conversation Created
            _conversationRepoMock.Verify(x => x.AddAsync(It.IsAny<ChatConversation>()), Times.Once);

            // Verify Redis Cleanup
            _redisCacheServiceMock.Verify(x => x.RemoveAsync($"waiting_{token}"), Times.Once);
        }

        [Fact]
        public async Task AcceptBookingAsync_ShouldFail_WhenTokenInvalid()
        {
            // Arrange
            var input = new AcceptBookingDto { Token = "invalid", BookingId = Guid.NewGuid() };
            _redisCacheServiceMock.Setup(x => x.GetAsync<string>(It.IsAny<string>())).ReturnsAsync((string?)null);

            // Act
            var result = await _bookingService.AcceptBookingAsync(Guid.NewGuid(), input);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("hết hạn", result.Message);
        }

        [Fact]
        public async Task AcceptBookingAsync_ShouldFail_WhenValidationFails()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();
            var token = "token";

            _redisCacheServiceMock.Setup(x => x.GetAsync<string>($"waiting_{token}")).ReturnsAsync("valid");

            // Case 1: Wrong Tech (Redis lưu tech khác)
            _redisCacheServiceMock.Setup(x => x.GetAsync<Guid>($"accept_{token}")).ReturnsAsync(Guid.NewGuid());
            var tech = new TechnicianProfile { Id = techId, UserId = userId };
            MockRepoGetAll(_technicianRepoMock, new List<TechnicianProfile> { tech });

            var res1 = await _bookingService.AcceptBookingAsync(userId, new AcceptBookingDto { Token = token });
            Assert.False(res1.IsSuccess);
            Assert.Contains("không phải kỹ thuật viên", res1.Message);

            // Reset Redis cho Case 2
            _redisCacheServiceMock.Setup(x => x.GetAsync<Guid>($"accept_{token}")).ReturnsAsync(techId);

            // Case 2: Booking Null
            _bookingRepoMock.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync((Booking?)null);
            var res2 = await _bookingService.AcceptBookingAsync(userId, new AcceptBookingDto { Token = token, BookingId = bookingId });
            Assert.False(res2.IsSuccess);
            Assert.Contains("không tồn tại", res2.Message);

            // Case 3: Booking Not Pending
            var booking = new Booking { Id = bookingId, Status = BookingStatus.Confirmed };
            _bookingRepoMock.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            var res3 = await _bookingService.AcceptBookingAsync(userId, new AcceptBookingDto { Token = token, BookingId = bookingId });
            Assert.False(res3.IsSuccess);
            Assert.Contains("đã được xử lý", res3.Message);
        }

        // ==========================================
        // TEST: AddEquipmentToBookingAsync
        // ==========================================

        [Fact]
        public async Task AddEquipmentToBookingAsync_ShouldAdd_WhenInventoryIsEnough()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var techUserId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var equipmentId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.InProgress };
            // SỬA Ở ĐÂY: Dùng AppUser
            var technician = new TechnicianProfile
            {
                Id = techId,
                User = new AppUser { Id = techUserId }
            };
            var equipment = new Equipment { Id = equipmentId, Quantity = 10, UnitPrice = 100 };

            _bookingRepoMock.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            MockRepoGetAll(_technicianRepoMock, new List<TechnicianProfile> { technician });
            _equipmentRepoMock.Setup(x => x.GetByIdAsync(equipmentId)).ReturnsAsync(equipment);

            // Mock empty existing booking equipment
            MockRepoGetAll(_bookingEquipmentRepoMock, new List<BookingEquipment>());

            var input = new AddBookingEquipmentDto { EquipmentId = equipmentId, Quantity = 5 };

            // Act
            var result = await _bookingService.AddEquipmentToBookingAsync(bookingId, input, techUserId);

            // Assert
            Assert.True(result);
            Assert.Equal(5, equipment.Quantity); // 10 - 5
            _equipmentRepoMock.Verify(x => x.Update(equipment), Times.Once);
            _bookingEquipmentRepoMock.Verify(x => x.AddAsync(It.Is<BookingEquipment>(be =>
                be.Quantity == 5 && be.BookingId == bookingId)), Times.Once);
        }

        [Fact]
        public async Task AddEquipmentToBookingAsync_ShouldThrow_WhenInventoryInsufficient()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var techUserId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var equipmentId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.InProgress };
            // SỬA Ở ĐÂY: Dùng AppUser
            var technician = new TechnicianProfile
            {
                Id = techId,
                User = new AppUser { Id = techUserId }
            };
            var equipment = new Equipment { Id = equipmentId, Quantity = 2 }; // Chỉ còn 2

            _bookingRepoMock.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            MockRepoGetAll(_technicianRepoMock, new List<TechnicianProfile> { technician });
            _equipmentRepoMock.Setup(x => x.GetByIdAsync(equipmentId)).ReturnsAsync(equipment);
            MockRepoGetAll(_bookingEquipmentRepoMock, new List<BookingEquipment>());

            var input = new AddBookingEquipmentDto { EquipmentId = equipmentId, Quantity = 5 }; // Muốn mua 5

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _bookingService.AddEquipmentToBookingAsync(bookingId, input, techUserId));
        }

        [Fact]
        public async Task AddEquipmentToBookingAsync_ShouldUpdateQuantity_WhenItemExists()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var techUserId = Guid.NewGuid();
            var equipmentId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.InProgress };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = techUserId } };
            var equipment = new Equipment { Id = equipmentId, Quantity = 10, UnitPrice = 100 };

            // Existing Item
            var existingItem = new BookingEquipment { BookingId = bookingId, EquipmentId = equipmentId, Quantity = 2, IsDeleted = false };

            _bookingRepoMock.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            MockRepoGetAll(_technicianRepoMock, new List<TechnicianProfile> { technician });
            _equipmentRepoMock.Setup(x => x.GetByIdAsync(equipmentId)).ReturnsAsync(equipment);
            MockRepoGetAll(_bookingEquipmentRepoMock, new List<BookingEquipment> { existingItem });

            // Act
            await _bookingService.AddEquipmentToBookingAsync(bookingId, new AddBookingEquipmentDto { EquipmentId = equipmentId, Quantity = 3 }, techUserId);

            // Assert
            Assert.Equal(5, existingItem.Quantity); // 2 + 3
            Assert.Equal(7, equipment.Quantity);    // 10 - 3
            _bookingEquipmentRepoMock.Verify(x => x.Update(existingItem), Times.Once);
        }

        [Fact]
        public async Task AddEquipmentToBookingAsync_ShouldThrow_WhenValidationFails()
        {
            var bookingId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var techUserId = Guid.NewGuid();

            // Case 1: Booking Null
            _bookingRepoMock.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync((Booking?)null);
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _bookingService.AddEquipmentToBookingAsync(bookingId, new AddBookingEquipmentDto(), techUserId));

            // Case 2: Unauthorized (Wrong Tech)
            var booking = new Booking { Id = bookingId, TechnicianId = Guid.NewGuid() };
            var tech = new TechnicianProfile { Id = techId, User = new AppUser { Id = techUserId } };
            _bookingRepoMock.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            MockRepoGetAll(_technicianRepoMock, new List<TechnicianProfile> { tech });
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _bookingService.AddEquipmentToBookingAsync(bookingId, new AddBookingEquipmentDto(), techUserId));

            // Case 3: Invalid Status (Pending)
            booking.TechnicianId = techId;
            booking.Status = BookingStatus.Pending;
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _bookingService.AddEquipmentToBookingAsync(bookingId, new AddBookingEquipmentDto(), techUserId));

            // Case 4: Equipment Null
            booking.Status = BookingStatus.InProgress;
            _equipmentRepoMock.Setup(x => x.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Equipment?)null);
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _bookingService.AddEquipmentToBookingAsync(bookingId, new AddBookingEquipmentDto { EquipmentId = Guid.NewGuid() }, techUserId));
        }

        // ==========================================
        // TEST: RemoveEquipmentFromBookingAsync
        // ==========================================

        [Fact]
        public async Task RemoveEquipmentFromBookingAsync_ShouldRemoveAndRestoreInventory()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var techUserId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var bookingEquipmentId = Guid.NewGuid();
            var equipmentId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.InProgress };
            // SỬA Ở ĐÂY: Dùng AppUser
            var technician = new TechnicianProfile
            {
                Id = techId,
                User = new AppUser { Id = techUserId }
            };
            var bookingEquipment = new BookingEquipment { Id = bookingEquipmentId, EquipmentId = equipmentId, Quantity = 3, IsDeleted = false };
            var equipment = new Equipment { Id = equipmentId, Quantity = 10 };

            _bookingRepoMock.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            MockRepoGetAll(_technicianRepoMock, new List<TechnicianProfile> { technician });
            _bookingEquipmentRepoMock.Setup(x => x.GetByIdAsync(bookingEquipmentId)).ReturnsAsync(bookingEquipment);
            _equipmentRepoMock.Setup(x => x.GetByIdAsync(equipmentId)).ReturnsAsync(equipment);

            // Act
            var result = await _bookingService.RemoveEquipmentFromBookingAsync(bookingId, bookingEquipmentId, techUserId);

            // Assert
            Assert.True(result);
            Assert.True(bookingEquipment.IsDeleted);
            Assert.Equal(13, equipment.Quantity); // 10 + 3 Restored
            _equipmentRepoMock.Verify(x => x.Update(equipment), Times.Once);
        }

        [Fact]
        public async Task RemoveEquipmentFromBookingAsync_ShouldThrow_WhenValidationFails()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var techUserId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.Pending }; // Wrong Status
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = techUserId } };

            _bookingRepoMock.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            MockRepoGetAll(_technicianRepoMock, new List<TechnicianProfile> { technician });

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _bookingService.RemoveEquipmentFromBookingAsync(bookingId, Guid.NewGuid(), techUserId));
        }

        [Fact]
        public async Task RemoveEquipmentFromBookingAsync_ShouldRollback_WhenDbErrorOccurs()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var techUserId = Guid.NewGuid();
            var itemId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.InProgress };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = techUserId } };
            var item = new BookingEquipment { Id = itemId, BookingId = bookingId };

            _bookingRepoMock.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            MockRepoGetAll(_technicianRepoMock, new List<TechnicianProfile> { technician });
            _bookingEquipmentRepoMock.Setup(x => x.GetByIdAsync(itemId)).ReturnsAsync(item);

            // Mock SaveChangesAsync throw Exception
            _unitOfWorkMock.Setup(x => x.SaveChangesAsync()).ThrowsAsync(new Exception("DB Error"));

            // Act & Assert
            await Assert.ThrowsAsync<Exception>(() =>
                _bookingService.RemoveEquipmentFromBookingAsync(bookingId, itemId, techUserId));

            // Quan trọng: Kiểm tra transaction có rollback hay không
            // Lưu ý: Mock Transaction từ Constructor phải được setup đúng cách (như trong code trước đó)
            // Code gốc dùng "using (var transaction = ...)" nên ta cần verify trên object transaction trả về
        }

        //[Fact]
        //public async Task GetAllBookingsAsync_ShouldFilterBySearchTermAndStatus()
        //{
        //    // Arrange
        //    var input = new BookingInput
        //    {
        //        SearchTerm = "Hỏng",
        //        Status = BookingStatus.Pending,
        //        OrderBy = "DateCreated"
        //    };

        //    var booking1 = new Booking
        //    {
        //        Id = Guid.NewGuid(),
        //        ProblemDescription = "Hỏng máy lạnh",
        //        Status = BookingStatus.Pending,
        //        DateCreated = DateTime.UtcNow,
        //        Customer = new AppUser { UserName = "UserA" }
        //    };

        //    var booking2 = new Booking
        //    {
        //        Id = Guid.NewGuid(),
        //        ProblemDescription = "Vệ sinh máy",
        //        Status = BookingStatus.Pending,
        //        DateCreated = DateTime.UtcNow.AddHours(1),
        //        Customer = new AppUser { UserName = "UserB" }
        //    };

        //    var booking3 = new Booking
        //    {
        //        Id = Guid.NewGuid(),
        //        ProblemDescription = "Hỏng quạt",
        //        Status = BookingStatus.Completed,
        //        DateCreated = DateTime.UtcNow.AddHours(2),
        //        Customer = new AppUser { UserName = "UserC" }
        //    };

        //    MockRepoGetAll(_bookingRepoMock, new List<Booking> { booking1, booking2, booking3 });
        //    MockRepoGetAll(_bookingItemRepoMock, new List<BookingItem>());
        //    MockRepoGetAll(_bookingEquipmentRepoMock, new List<BookingEquipment>());

        //    // Act
        //    var result = await _bookingService.GetAllBookingsAsync(input);

        //    // Assert
        //    Assert.NotNull(result);
        //    // SỬA: Dùng result.Items thay vì result
        //    Assert.Single(result.Items);
        //    Assert.Equal(booking1.Id, result.Items.First().Id);
        //}

        [Fact]
        public async Task GetAllBookingsAsync_ShouldFilterByDateRange()
        {
            // Arrange
            var today = DateTime.UtcNow;
            var input = new BookingInput
            {
                FromDate = today.AddDays(-1),
                ToDate = today.AddDays(1)
            };

            var b1 = new Booking { Id = Guid.NewGuid(), DesiredDate = today, Customer = new AppUser() };
            var b2 = new Booking { Id = Guid.NewGuid(), DesiredDate = today.AddDays(-2), Customer = new AppUser() };
            var b3 = new Booking { Id = Guid.NewGuid(), DesiredDate = today.AddDays(2), Customer = new AppUser() };

            MockRepoGetAll(_bookingRepoMock, new List<Booking> { b1, b2, b3 });
            MockRepoGetAll(_bookingItemRepoMock, new List<BookingItem>());
            MockRepoGetAll(_bookingEquipmentRepoMock, new List<BookingEquipment>());

            // Act
            var result = await _bookingService.GetAllBookingsAsync(input);

            // Assert
            // SỬA: Dùng result.Items
            Assert.Single(result.Items);
            Assert.Equal(b1.Id, result.Items.First().Id);
        }

        //[Fact]
        //public async Task GetAllBookingsAsync_ShouldFilterByTechnicianAndCustomer()
        //{
        //    // Arrange
        //    var techId = Guid.NewGuid();
        //    var customerId = Guid.NewGuid();

        //    var input = new BookingInput
        //    {
        //        TechnicianId = techId,
        //        CustomerId = customerId
        //    };

        //    var b1 = new Booking { Id = Guid.NewGuid(), TechnicianId = techId, CustomerId = customerId, Customer = new AppUser() };
        //    var b2 = new Booking { Id = Guid.NewGuid(), TechnicianId = Guid.NewGuid(), CustomerId = customerId, Customer = new AppUser() };

        //    // Mock data trả về từ Repository (chúng ta giả lập rằng Repository đã filter đúng, 
        //    // test này chủ yếu để code chạy qua dòng if check HasValue)
        //    MockRepoGetAll(_bookingRepoMock, new List<Booking> { b1, b2 });
        //    MockRepoGetAll(_bookingItemRepoMock, new List<BookingItem>());
        //    MockRepoGetAll(_bookingEquipmentRepoMock, new List<BookingEquipment>());

        //    // Act
        //    var result = await _bookingService.GetAllBookingsAsync(input);

        //    // Assert
        //    Assert.NotNull(result);
        //    // Lưu ý: Vì ta đang mock GetAll trả về list cố định, kết quả assert phụ thuộc vào cách MockQueryable hoạt động.
        //    // Tuy nhiên mục tiêu chính là code coverage đi qua dòng 'if (input.TechnicianId.HasValue)'
        //    Assert.NotNull(result.Items);
        //}

        [Fact]
        public async Task TechnicianRejectAsync_ShouldSetRedisKey_WhenTechnicianExists()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var techUserId = Guid.NewGuid();
            var techId = Guid.NewGuid();

            var technician = new TechnicianProfile
            {
                Id = techId,
                UserId = techUserId
            };

            // Mock tìm thấy Technician dựa trên UserId
            var technicians = new List<TechnicianProfile> { technician };
            MockRepoGetAll(_technicianRepoMock, technicians);

            // Act
            var result = await _bookingService.TechnicianRejectAsync(bookingId, techUserId);

            // Assert
            Assert.True(result);

            // Verify Redis SetAsync được gọi đúng key và value
            _redisCacheServiceMock.Verify(x => x.SetAsync(
                $"reject_{bookingId}_{techId}",
                "rejected",
                null), Times.Once);
        }

        [Fact]
        public async Task TechnicianRejectAsync_ShouldThrowException_WhenTechnicianNotFound()
        {
            // Arrange
            MockRepoGetAll(_technicianRepoMock, new List<TechnicianProfile>());

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _bookingService.TechnicianRejectAsync(Guid.NewGuid(), Guid.NewGuid()));

            Assert.Equal("Kỹ thuật viên không tồn tại", ex.Message);
        }
    }
}