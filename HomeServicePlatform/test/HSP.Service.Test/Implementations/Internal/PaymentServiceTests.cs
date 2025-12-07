using HSP.Core.Abstractions.Entity;
using HSP.Core.Abstractions.External;
using HSP.Core.Dtos.ConfigurationDto;
using HSP.Core.Dtos.PaymentDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Implementations.Internal;
using HSP.Service.Interfaces;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using MockQueryable;
using MockQueryable.Moq; // <--- QUAN TRỌNG: Import thư viện này
using Moq;
using System.Linq.Expressions;
using Xunit;

namespace HSP.Service.Test.Implementations.Internal
{
    public class PaymentServiceTests
    {
        private readonly Mock<IRepository<Payment, Guid>> _mockPaymentRepository;
        private readonly Mock<IRepository<Booking, Guid>> _mockBookingRepository;
        private readonly Mock<ISePayService> _mockSePayService;
        private readonly Mock<IRepository<ChatConversation, Guid>> _mockChatConversationRepo;
        private readonly Mock<IRepository<BookingEquipment, Guid>> _mockBookingEquipmentRepo;
        private readonly Mock<IBookingService> _mockBookingService;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IStringLocalizer<SharedResource>> _mockLocalizer;
        private readonly IOptions<SePayConfigurationDto> _sePayConfig;

        private readonly PaymentService _paymentService;

        public PaymentServiceTests()
        {
            _mockPaymentRepository = new Mock<IRepository<Payment, Guid>>();
            _mockBookingRepository = new Mock<IRepository<Booking, Guid>>();
            _mockSePayService = new Mock<ISePayService>();
            _mockChatConversationRepo = new Mock<IRepository<ChatConversation, Guid>>();
            _mockBookingEquipmentRepo = new Mock<IRepository<BookingEquipment, Guid>>();
            _mockBookingService = new Mock<IBookingService>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockLocalizer = new Mock<IStringLocalizer<SharedResource>>();

            // Setup Localizer
            _mockLocalizer.Setup(l => l[It.IsAny<string>()]).Returns((string key) => new LocalizedString(key, key));
            _mockLocalizer.Setup(l => l[It.IsAny<string>(), It.IsAny<object[]>()])
                .Returns((string key, object[] args) => new LocalizedString(key, string.Format(key, args)));

            var config = new SePayConfigurationDto
            {
                ReturnUrl = "http://test.com/return",
                CallbackUrl = "http://test.com/callback"
            };
            _sePayConfig = Options.Create(config);

            _paymentService = new PaymentService(
                _mockPaymentRepository.Object,
                _mockBookingRepository.Object,
                _mockSePayService.Object,
                _mockChatConversationRepo.Object,
                _sePayConfig,
                _mockUnitOfWork.Object,
                _mockLocalizer.Object,
                _mockBookingEquipmentRepo.Object,
                _mockBookingService.Object
            );
        }

        // --- Helper RÚT GỌN (Sử dụng MockQueryable) ---
        private void SetupRepository<T>(Mock<IRepository<T, Guid>> repoMock, List<T> data)
            where T : BaseEntity<Guid>
        {
            // BuildMock() là hàm mở rộng từ thư viện MockQueryable.Moq
            // Nó tự động tạo IQueryable hỗ trợ Async (ToListAsync, FirstOrDefaultAsync...)
            var mockSet = data.BuildMock();

            repoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<T, object>>[]>()))
                .Returns(mockSet);

            repoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((Guid id) => data.FirstOrDefault(x => x.Id == id));
        }

        #region CreatePaymentAsync Tests

        [Fact]
        public async Task CreatePaymentAsync_ShouldReturnFail_WhenBookingNotFound()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            SetupRepository(_mockBookingRepository, new List<Booking>());

            var input = new CreatePaymentDto { BookingId = bookingId };

            // Act
            var result = await _paymentService.CreatePaymentAsync(input, "userId");

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Booking not found", result.Message);
        }

        [Fact]
        public async Task CreatePaymentAsync_ShouldReturnFail_WhenDistanceIsTooFar()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var technician = new TechnicianProfile { Id = Guid.NewGuid(), Latitude = 10.0000, Longitude = 106.0000 };
            var booking = new Booking
            {
                Id = bookingId,
                Customer = new AppUser(),
                Technician = technician,
                Latitude = 11.0000,
                Longitude = 107.0000,
                IsDeleted = false
            };

            SetupRepository(_mockBookingRepository, new List<Booking> { booking });

            var input = new CreatePaymentDto { BookingId = bookingId, Amount = 100000 };

            // Act
            var result = await _paymentService.CreatePaymentAsync(input, "userId");

            // Assert
            Assert.False(result.Success);
            Assert.Equal("KTV không ở tại vị trí làm việc", result.Message);
        }

        [Fact]
        public async Task CreatePaymentAsync_ShouldCreateSePayOrder_WhenValid()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var technician = new TechnicianProfile { Id = Guid.NewGuid(), Latitude = 10.762622, Longitude = 106.660172 };
            var booking = new Booking
            {
                Id = bookingId,
                Customer = new AppUser { FullName = "Test User", Email = "test@test.com" },
                Technician = technician,
                Latitude = 10.762622,
                Longitude = 106.660172,
                IsDeleted = false
            };

            SetupRepository(_mockBookingRepository, new List<Booking> { booking });
            SetupRepository(_mockPaymentRepository, new List<Payment>());
            SetupRepository(_mockChatConversationRepo, new List<ChatConversation>());

            var input = new CreatePaymentDto
            {
                BookingId = bookingId,
                Amount = 50000,
                PaymentMethod = PaymentMethod.QRCode
            };

            var sePayResponse = new SePayCreateOrderResponse
            {
                Success = true,
                OrderId = "SEPAY123",
                PaymentUrl = "http://sepay.com/pay"
            };

            _mockSePayService.Setup(s => s.CreatePaymentOrderAsync(It.IsAny<SePayCreateOrderRequest>()))
                .ReturnsAsync(sePayResponse);

            // Act
            var result = await _paymentService.CreatePaymentAsync(input, "userId");

            // Assert
            Assert.True(result.Success);
            Assert.Equal("SEPAY123", result.Payment.SePayOrderId);

            _mockPaymentRepository.Verify(r => r.AddAsync(It.IsAny<Payment>()), Times.Once);
            _mockPaymentRepository.Verify(r => r.Update(It.IsAny<Payment>()), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.AtLeast(2));
        }

        [Fact]
        public async Task CreatePaymentAsync_ShouldFail_WhenLocationIsMissing()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var booking = new Booking
            {
                Id = bookingId,
                Customer = new AppUser(),
                Technician = new TechnicianProfile { Latitude = 10, Longitude = 10 },
                Latitude = 0, // Mocking invalid logic: giả sử code check null, hoặc value = 0 tùy logic validation
                // Trong code gốc bạn check: booking.Latitude == null. 
                // Vì double không null được trừ khi là double?, hãy đảm bảo entity của bạn đúng.
                // Giả định entity là double? như trong code service check null
            };
            // Note: Nếu Entity định nghĩa double (không ?), logic check null trong Service sẽ luôn false.
            // Test này giả định Booking có thể trả về null location hoặc logic check.

            // Tuy nhiên, dựa vào code service: "if (booking.Latitude == null...)" 
            // -> Ta cần setup Booking sao cho check này true. Nếu entity là double non-nullable, branch này là Dead Code.
            // Giả sử Entity đã sửa thành double? hoặc ta test logic logic Technician location null.

            var bookingNullLoc = new Booking
            {
                Id = bookingId,
                Customer = new AppUser(),
                Technician = null, // Technician null -> location null
                IsDeleted = false
            };

            SetupRepository(_mockBookingRepository, new List<Booking> { bookingNullLoc });

            var input = new CreatePaymentDto { BookingId = bookingId };

            // Act
            var result = await _paymentService.CreatePaymentAsync(input, "uid");

            // Assert
            Assert.False(result.Success);
            Assert.Contains("Không thể xác định vị trí", result.Message);
        }

        [Fact]
        public async Task CreatePaymentAsync_ShouldFail_WhenPaymentAlreadyExists()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var tech = new TechnicianProfile { Latitude = 10, Longitude = 10 };
            var booking = new Booking { Id = bookingId, Customer = new AppUser(), Technician = tech, Latitude = 10, Longitude = 10 };

            var existingPayment = new Payment
            {
                BookingId = bookingId,
                Type = PaymentType.Service,
                Status = PaymentStatus.Completed
            };

            SetupRepository(_mockBookingRepository, new List<Booking> { booking });
            SetupRepository(_mockPaymentRepository, new List<Payment> { existingPayment });

            var input = new CreatePaymentDto { BookingId = bookingId };

            // Act
            var result = await _paymentService.CreatePaymentAsync(input, "uid");

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Booking already has a completed payment", result.Message);
        }

        [Fact]
        public async Task CreatePaymentAsync_ShouldFail_WhenSePayCreateOrderFails()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var booking = new Booking
            {
                Id = bookingId,
                Customer = new AppUser(),
                Technician = new TechnicianProfile { Latitude = 10, Longitude = 10 },
                Latitude = 10,
                Longitude = 10
            };

            SetupRepository(_mockBookingRepository, new List<Booking> { booking });
            SetupRepository(_mockPaymentRepository, new List<Payment>());
            SetupRepository(_mockChatConversationRepo, new List<ChatConversation>());

            var input = new CreatePaymentDto { BookingId = bookingId, PaymentMethod = PaymentMethod.QRCode, Amount = 50000 };

            _mockSePayService.Setup(s => s.CreatePaymentOrderAsync(It.IsAny<SePayCreateOrderRequest>()))
                .ReturnsAsync(new SePayCreateOrderResponse { Success = false, Message = "API Error" });

            // Act
            var result = await _paymentService.CreatePaymentAsync(input, "uid");

            // Assert
            Assert.False(result.Success);
            Assert.Contains("Failed to create payment", result.Message);

            // Verify payment saved as Failed
            _mockPaymentRepository.Verify(r => r.Update(It.Is<Payment>(p => p.Status == PaymentStatus.Failed)), Times.Once);
        }

        [Fact]
        public async Task CreatePaymentAsync_ShouldCloseChat_WhenPaymentCreated()
        {
            // Test nhánh logic: if (isClosed != null) { isClosed.IsClosed = true; }
            // Arrange
            var bookingId = Guid.NewGuid();
            var booking = new Booking
            {
                Id = bookingId,
                Customer = new AppUser(),
                Technician = new TechnicianProfile { Latitude = 10, Longitude = 10 },
                Latitude = 10,
                Longitude = 10
            };

            var chatConversation = new ChatConversation { BookingId = bookingId, IsClosed = false };

            SetupRepository(_mockBookingRepository, new List<Booking> { booking });
            SetupRepository(_mockPaymentRepository, new List<Payment>());
            SetupRepository(_mockChatConversationRepo, new List<ChatConversation> { chatConversation });

            var input = new CreatePaymentDto { BookingId = bookingId, PaymentMethod = PaymentMethod.QRCode, Amount = 100 };

            _mockSePayService.Setup(s => s.CreatePaymentOrderAsync(It.IsAny<SePayCreateOrderRequest>()))
                .ReturnsAsync(new SePayCreateOrderResponse { Success = true });

            // Act
            await _paymentService.CreatePaymentAsync(input, "uid");

            // Assert
            Assert.True(chatConversation.IsClosed); // Verify chat was closed
            //_mockChatConversationRepo.Verify(r => r.Update(It.IsAny<ChatConversation>()), Times.AtLeastOnce); // Verify repo update call
        }

        [Fact]
        public async Task CreatePaymentAsync_ShouldHandle_SePayFailure()
        {
            // Test nhánh logic: if (sePayResponse.Success) ... else { ... }
            // Arrange
            var bookingId = Guid.NewGuid();
            var booking = new Booking
            {
                Id = bookingId,
                Customer = new AppUser(),
                Technician = new TechnicianProfile { Latitude = 10, Longitude = 10 },
                Latitude = 10,
                Longitude = 10
            };

            SetupRepository(_mockBookingRepository, new List<Booking> { booking });
            SetupRepository(_mockPaymentRepository, new List<Payment>());
            SetupRepository(_mockChatConversationRepo, new List<ChatConversation>());

            var input = new CreatePaymentDto { BookingId = bookingId, PaymentMethod = PaymentMethod.EWallet };

            _mockSePayService.Setup(s => s.CreatePaymentOrderAsync(It.IsAny<SePayCreateOrderRequest>()))
                .ReturnsAsync(new SePayCreateOrderResponse { Success = false, Message = "Bank maintenance" });

            // Act
            var result = await _paymentService.CreatePaymentAsync(input, "uid");

            // Assert
            Assert.False(result.Success);
            Assert.Contains("Bank maintenance", result.Message);
            // Verify status is Failed
            _mockPaymentRepository.Verify(r => r.Update(It.Is<Payment>(p => p.Status == PaymentStatus.Failed)), Times.Once);
        }

        [Fact]
        public async Task CreatePaymentAsync_ShouldReturnSuccessImmediately_WhenMethodIsCash()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var booking = new Booking
            {
                Id = bookingId,
                Customer = new AppUser(),
                Technician = new TechnicianProfile { Latitude = 10, Longitude = 10 },
                Latitude = 10,
                Longitude = 10
            };

            SetupRepository(_mockBookingRepository, new List<Booking> { booking });
            SetupRepository(_mockPaymentRepository, new List<Payment>());

            var input = new CreatePaymentDto
            {
                BookingId = bookingId,
                Amount = 50000,
                PaymentMethod = PaymentMethod.Cash // Quan trọng: CASH
            };

            // Act
            var result = await _paymentService.CreatePaymentAsync(input, "uid");

            // Assert
            Assert.True(result.Success);
            Assert.Equal(PaymentStatus.Pending, result.Payment.Status);

            // Verify: KHÔNG gọi SePay service
            _mockSePayService.Verify(s => s.CreatePaymentOrderAsync(It.IsAny<SePayCreateOrderRequest>()), Times.Never);
        }

        #endregion

        #region CreateEquipmentPaymentAsync Tests

        [Fact]
        public async Task CreateEquipmentPaymentAsync_ShouldCalculateTotalCorrectly_AndMarkItems()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var eq1Id = Guid.NewGuid();
            var booking = new Booking { Id = bookingId, Customer = new AppUser() };

            var bookingEquipments = new List<BookingEquipment>
            {
                new BookingEquipment
                {
                    Id = eq1Id,
                    BookingId = bookingId,
                    Status = BookingEquipmentStatus.Submitted,
                    Quantity = 2,
                    UnitPrice = 10000
                }
            };

            SetupRepository(_mockBookingRepository, new List<Booking> { booking });
            SetupRepository(_mockBookingEquipmentRepo, bookingEquipments);
            SetupRepository(_mockPaymentRepository, new List<Payment>());

            var input = new CreateEquipmentPaymentDto
            {
                BookingId = bookingId,
                BookingEquipmentIds = new List<Guid> { eq1Id },
                PaymentMethod = PaymentMethod.Cash
            };

            // Act
            var result = await _paymentService.CreateEquipmentPaymentAsync(input, "userId");

            // Assert
            Assert.True(result.Success);
            Assert.Equal(70000, result.Payment.Amount); // (2*10k) + 50k ship
            Assert.Equal(PaymentType.Equipment, result.Payment.Type);

            _mockBookingEquipmentRepo.Verify(r => r.Update(It.Is<BookingEquipment>(
                be => be.Id == eq1Id && be.PaymentId == result.Payment.Id
            )), Times.Once);
        }

        [Fact]
        public async Task CreateEquipmentPaymentAsync_ShouldFail_WhenItemCountMismatch()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var booking = new Booking { Id = bookingId, Customer = new AppUser() };

            // DB chỉ có 1 item hợp lệ
            var dbItem = new BookingEquipment { Id = Guid.NewGuid(), BookingId = bookingId, Status = BookingEquipmentStatus.Submitted };

            SetupRepository(_mockBookingRepository, new List<Booking> { booking });
            SetupRepository(_mockBookingEquipmentRepo, new List<BookingEquipment> { dbItem });

            // Input yêu cầu thanh toán 2 item (1 item không tồn tại)
            var input = new CreateEquipmentPaymentDto
            {
                BookingId = bookingId,
                BookingEquipmentIds = new List<Guid> { dbItem.Id, Guid.NewGuid() }
            };

            // Act
            var result = await _paymentService.CreateEquipmentPaymentAsync(input, "uid");

            // Assert
            Assert.False(result.Success);
            Assert.Contains("không hợp lệ", result.Message);
        }

        [Fact]
        public async Task CreateEquipmentPaymentAsync_ShouldCreateSePayOrder_WhenMethodIsNotCash()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var eqId = Guid.NewGuid();
            var booking = new Booking { Id = bookingId, Customer = new AppUser { FullName = "Customer" } };
            var item = new BookingEquipment { Id = eqId, BookingId = bookingId, Status = BookingEquipmentStatus.Submitted, Quantity = 1, UnitPrice = 10000 };

            SetupRepository(_mockBookingRepository, new List<Booking> { booking });
            SetupRepository(_mockBookingEquipmentRepo, new List<BookingEquipment> { item });
            SetupRepository(_mockPaymentRepository, new List<Payment>());

            var input = new CreateEquipmentPaymentDto
            {
                BookingId = bookingId,
                BookingEquipmentIds = new List<Guid> { eqId },
                PaymentMethod = PaymentMethod.BankTransfer // Trigger SePay logic
            };

            _mockSePayService.Setup(s => s.CreatePaymentOrderAsync(It.IsAny<SePayCreateOrderRequest>()))
                .ReturnsAsync(new SePayCreateOrderResponse { Success = true, OrderId = "EQ_ORDER_1" });

            // Act
            var result = await _paymentService.CreateEquipmentPaymentAsync(input, "uid");

            // Assert
            Assert.True(result.Success);
            Assert.Equal("EQ_ORDER_1", result.Payment.SePayOrderId);
            Assert.Equal(PaymentStatus.Processing, result.Payment.Status);
        }

        [Fact]
        public async Task CreateEquipmentPaymentAsync_ShouldHandle_SePayFailure()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var eqId = Guid.NewGuid();
            var booking = new Booking { Id = bookingId, Customer = new AppUser() };
            var item = new BookingEquipment { Id = eqId, BookingId = bookingId, Status = BookingEquipmentStatus.Submitted, Quantity = 1, UnitPrice = 10000 };

            SetupRepository(_mockBookingRepository, new List<Booking> { booking });
            SetupRepository(_mockBookingEquipmentRepo, new List<BookingEquipment> { item });
            SetupRepository(_mockPaymentRepository, new List<Payment>());

            var input = new CreateEquipmentPaymentDto
            {
                BookingId = bookingId,
                BookingEquipmentIds = new List<Guid> { eqId },
                PaymentMethod = PaymentMethod.QRCode
            };

            _mockSePayService.Setup(s => s.CreatePaymentOrderAsync(It.IsAny<SePayCreateOrderRequest>()))
                .ReturnsAsync(new SePayCreateOrderResponse { Success = false, Message = "Fail" });

            // Act
            var result = await _paymentService.CreateEquipmentPaymentAsync(input, "uid");

            // Assert
            Assert.False(result.Success);
            Assert.Null(result.Payment); // Xác nhận rằng Payment trả về là null theo đúng logic hiện tại

            // FIX: Verify trực tiếp vào Repository để đảm bảo trạng thái đã được cập nhật xuống DB là Failed
            _mockPaymentRepository.Verify(r => r.Update(It.Is<Payment>(p =>
                p.Status == PaymentStatus.Failed &&
                p.FailureReason == "Fail"
            )), Times.Once);
        }

        #endregion

        #region HandleSePayWebhookAsync Tests

        [Fact]
        public async Task HandleSePayWebhookAsync_ShouldCompleteEquipmentPayment_AndSetItemsToPaid()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var sePayOrderId = "HSP12345678";
            var amount = 150000m;

            var payment = new Payment
            {
                Id = paymentId,
                SePayOrderId = sePayOrderId,
                Amount = amount,
                Status = PaymentStatus.Processing,
                Type = PaymentType.Equipment,
                BookingId = Guid.NewGuid()
            };

            var equipment = new BookingEquipment
            {
                Id = Guid.NewGuid(),
                PaymentId = paymentId,
                Status = BookingEquipmentStatus.Submitted
            };

            SetupRepository(_mockPaymentRepository, new List<Payment> { payment });
            SetupRepository(_mockBookingEquipmentRepo, new List<BookingEquipment> { equipment });

            var webhook = new SePayWebhookDto
            {
                Content = $"Payment for {sePayOrderId}",
                TransferAmount = amount,
                Id = 999
            };

            // Act
            var result = await _paymentService.HandleSePayWebhookAsync(webhook);

            // Assert
            Assert.True(result);
            Assert.Equal(PaymentStatus.Completed, payment.Status);

            // Do MockQueryable giữ nguyên reference của object trong list, 
            // nên ta có thể assert trực tiếp vào object equipment ban đầu.
            Assert.Equal(BookingEquipmentStatus.Paid, equipment.Status);

            _mockBookingService.Verify(s => s.TryCompleteBookingAsync(payment.BookingId), Times.Once);
        }

        [Fact]
        public async Task HandleSePayWebhookAsync_ShouldReturnTrueImmediately_IfAlreadyCompleted()
        {
            // Arrange
            // FIX: Dùng format đúng chuẩn "HSP" + 8 ký tự để qua được Regex validation
            var validCode = "HSP12345678";

            var payment = new Payment
            {
                SePayOrderId = validCode,
                Amount = 100,
                Status = PaymentStatus.Completed
            };

            SetupRepository(_mockPaymentRepository, new List<Payment> { payment });

            var webhook = new SePayWebhookDto
            {
                Content = $"Transfer content {validCode}", // Nội dung chứa mã code
                TransferAmount = 100
            };

            // Act
            var result = await _paymentService.HandleSePayWebhookAsync(webhook);

            // Assert
            Assert.True(result); // Giờ sẽ trả về True

            // Verify update was NOT called again (Idempotency)
            _mockPaymentRepository.Verify(r => r.Update(It.IsAny<Payment>()), Times.Never);
        }

        [Fact]
        public async Task HandleSePayWebhookAsync_ShouldReturnFalse_IfPaymentNotFound()
        {
            // Test Payment = null
            SetupRepository(_mockPaymentRepository, new List<Payment>());
            var result = await _paymentService.HandleSePayWebhookAsync(new SePayWebhookDto { Content = "HSP12345678" });
            Assert.False(result);
        }

        [Fact]
        public async Task HandleSePayWebhookAsync_ShouldProcessServicePayment_Correctly()
        {
            // Arrange
            // FIX: Sửa format thành "HSP" + 8 ký tự (A-Z, 0-9) để khớp với Regex trong Service
            var code = "HSP12345678";

            var payment = new Payment
            {
                SePayOrderId = code,
                Amount = 200000,
                Status = PaymentStatus.Processing,
                Type = PaymentType.Service, // SERVICE type
                BookingId = Guid.NewGuid()
            };

            SetupRepository(_mockPaymentRepository, new List<Payment> { payment });
            // Cần setup mock này để tránh null ref khi service logic gọi Include() hoặc GetAll()
            SetupRepository(_mockBookingEquipmentRepo, new List<BookingEquipment>());

            var webhook = new SePayWebhookDto { Content = $"Thanh toan {code}", TransferAmount = 200000 };

            // Act
            var result = await _paymentService.HandleSePayWebhookAsync(webhook);

            // Assert
            Assert.True(result);
            Assert.Equal(PaymentStatus.Completed, payment.Status);

            // Verify: Logic Equipment update KHÔNG được gọi
            _mockBookingEquipmentRepo.Verify(r => r.Update(It.IsAny<BookingEquipment>()), Times.Never);

            // Verify: Booking Service vẫn được gọi để complete booking
            _mockBookingService.Verify(s => s.TryCompleteBookingAsync(payment.BookingId), Times.Once);
        }

        #endregion

        #region HandlePaymentCallbackAsync Tests

        [Fact]
        public async Task HandlePaymentCallbackAsync_ShouldReturnFalse_WhenSignatureInvalid()
        {
            // Arrange
            var callback = new PaymentCallbackDto { Signature = "invalid" };
            _mockSePayService.Setup(s => s.VerifyCallbackSignature(callback)).Returns(false);

            // Act
            var result = await _paymentService.HandlePaymentCallbackAsync(callback);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task HandlePaymentCallbackAsync_ShouldCompletePayment_WhenSuccess()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var payment = new Payment { Id = paymentId, Status = PaymentStatus.Processing, BookingId = Guid.NewGuid() };
            var callback = new PaymentCallbackDto
            {
                OrderId = paymentId.ToString(),
                Status = "success",
                TransactionRef = "TRANS123"
            };

            _mockSePayService.Setup(s => s.VerifyCallbackSignature(callback)).Returns(true);
            SetupRepository(_mockPaymentRepository, new List<Payment> { payment });
            SetupRepository(_mockBookingEquipmentRepo, new List<BookingEquipment>()); // Empty list logic

            // Act
            var result = await _paymentService.HandlePaymentCallbackAsync(callback);

            // Assert
            Assert.True(result);
            Assert.Equal(PaymentStatus.Completed, payment.Status);
            Assert.Equal("TRANS123", payment.TransactionId);
            _mockBookingService.Verify(s => s.TryCompleteBookingAsync(payment.BookingId), Times.Once);
        }

        [Fact]
        public async Task HandlePaymentCallbackAsync_ShouldMarkFailed_WhenStatusFailed()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var payment = new Payment { Id = paymentId, Status = PaymentStatus.Processing };
            var callback = new PaymentCallbackDto { OrderId = paymentId.ToString(), Status = "failed", Message = "No money" };

            _mockSePayService.Setup(s => s.VerifyCallbackSignature(callback)).Returns(true);
            SetupRepository(_mockPaymentRepository, new List<Payment> { payment });

            // Act
            await _paymentService.HandlePaymentCallbackAsync(callback);

            // Assert
            Assert.Equal(PaymentStatus.Failed, payment.Status);
            Assert.Equal("No money", payment.FailureReason);
        }

        [Fact]
        public async Task HandlePaymentCallbackAsync_ShouldReturnFalse_WhenPaymentIdInvalid()
        {
            _mockSePayService.Setup(s => s.VerifyCallbackSignature(It.IsAny<PaymentCallbackDto>())).Returns(true);

            var callback = new PaymentCallbackDto { OrderId = "NotAGuid" };
            var result = await _paymentService.HandlePaymentCallbackAsync(callback);

            Assert.False(result);
        }

        [Fact]
        public async Task HandlePaymentCallbackAsync_ShouldMarkCancelled_WhenStatusCancelled()
        {
            var pid = Guid.NewGuid();
            var payment = new Payment { Id = pid, Status = PaymentStatus.Pending };
            SetupRepository(_mockPaymentRepository, new List<Payment> { payment });

            _mockSePayService.Setup(s => s.VerifyCallbackSignature(It.IsAny<PaymentCallbackDto>())).Returns(true);

            var callback = new PaymentCallbackDto { OrderId = pid.ToString(), Status = "cancelled" };

            // Act
            await _paymentService.HandlePaymentCallbackAsync(callback);

            // Assert
            Assert.Equal(PaymentStatus.Cancelled, payment.Status);
        }

        [Fact]
        public async Task HandlePaymentCallbackAsync_ShouldDoNothing_IfPaymentAlreadyCompleted()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var payment = new Payment
            {
                Id = paymentId,
                Status = PaymentStatus.Completed, // Đã hoàn thành trước đó
                DateModified = DateTime.UtcNow.AddHours(-1)
            };

            SetupRepository(_mockPaymentRepository, new List<Payment> { payment });
            _mockSePayService.Setup(s => s.VerifyCallbackSignature(It.IsAny<PaymentCallbackDto>())).Returns(true);

            var callback = new PaymentCallbackDto
            {
                OrderId = paymentId.ToString(),
                Status = "success"
            };

            // Act
            var result = await _paymentService.HandlePaymentCallbackAsync(callback);

            // Assert
            Assert.True(result);

            // QUAN TRỌNG: Verify rằng Repository.Update KHÔNG bao giờ được gọi
            // (Vì code return true ngay đầu hàm)
            _mockPaymentRepository.Verify(r => r.Update(It.IsAny<Payment>()), Times.Never);
        }

        [Fact]
        public async Task HandlePaymentCallbackAsync_ShouldUpdateEquipmentStatus_WhenSuccess()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var payment = new Payment
            {
                Id = paymentId,
                Status = PaymentStatus.Processing,
                Type = PaymentType.Equipment // Loại Equipment
            };

            var equipment = new BookingEquipment
            {
                Id = Guid.NewGuid(),
                PaymentId = paymentId,
                Status = BookingEquipmentStatus.Submitted
            };

            SetupRepository(_mockPaymentRepository, new List<Payment> { payment });
            SetupRepository(_mockBookingEquipmentRepo, new List<BookingEquipment> { equipment });
            _mockSePayService.Setup(s => s.VerifyCallbackSignature(It.IsAny<PaymentCallbackDto>())).Returns(true);

            var callback = new PaymentCallbackDto
            {
                OrderId = paymentId.ToString(),
                Status = "success",
                TransactionRef = "TRANS_EQ_CALLBACK"
            };

            // Act
            await _paymentService.HandlePaymentCallbackAsync(callback);

            // Assert
            Assert.Equal(PaymentStatus.Completed, payment.Status);
            // Verify: Equipment cũng được cập nhật sang Paid
            Assert.Equal(BookingEquipmentStatus.Paid, equipment.Status);
            _mockBookingEquipmentRepo.Verify(r => r.Update(equipment), Times.Once);
        }

        #endregion

        #region RefundPaymentAsync Tests

        [Fact]
        public async Task RefundPaymentAsync_ShouldReturnFalse_WhenPaymentNotCompleted()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var payment = new Payment { Id = paymentId, Status = PaymentStatus.Pending };
            SetupRepository(_mockPaymentRepository, new List<Payment> { payment });

            // Act
            var result = await _paymentService.RefundPaymentAsync(new RefundPaymentDto { PaymentId = paymentId }, "uid");

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task RefundPaymentAsync_ShouldCallSePay_AndRefund_WhenValid()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var payment = new Payment
            {
                Id = paymentId,
                Status = PaymentStatus.Completed,
                PaymentMethod = PaymentMethod.QRCode,
                SePayTransactionRef = "TRANS_REF",
                Amount = 100
            };
            SetupRepository(_mockPaymentRepository, new List<Payment> { payment });

            _mockSePayService.Setup(s => s.RefundPaymentAsync(It.IsAny<SePayRefundRequest>()))
                .ReturnsAsync(new SePayRefundResponse { Success = true });

            // Act
            var result = await _paymentService.RefundPaymentAsync(new RefundPaymentDto { PaymentId = paymentId, Reason = "Bad service" }, "uid");

            // Assert
            Assert.True(result);
            Assert.Equal(PaymentStatus.Refunded, payment.Status);
            Assert.Equal("Bad service", payment.RefundReason);
            _mockSePayService.Verify(s => s.RefundPaymentAsync(It.IsAny<SePayRefundRequest>()), Times.Once);
        }

        [Fact]
        public async Task RefundPaymentAsync_ShouldReturnFalse_WhenSePayRefundFails()
        {
            // Arrange
            var pid = Guid.NewGuid();
            var payment = new Payment { Id = pid, Status = PaymentStatus.Completed, PaymentMethod = PaymentMethod.EWallet, SePayTransactionRef = "REF" };
            SetupRepository(_mockPaymentRepository, new List<Payment> { payment });

            _mockSePayService.Setup(s => s.RefundPaymentAsync(It.IsAny<SePayRefundRequest>()))
                .ReturnsAsync(new SePayRefundResponse { Success = false });

            // Act
            var result = await _paymentService.RefundPaymentAsync(new RefundPaymentDto { PaymentId = pid, Reason = "R" }, "u");

            // Assert
            Assert.False(result);
            Assert.Equal(PaymentStatus.Completed, payment.Status); // Status unchanged
        }

        #endregion

        #region QueryPaymentStatusAsync Tests

        [Fact]
        public async Task QueryPaymentStatusAsync_ShouldUpdateStatus_WhenSePayReturnsCompleted()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();
            var payment = new Payment
            {
                Id = paymentId,
                BookingId = bookingId,
                Status = PaymentStatus.Processing,
                SePayOrderId = "ORDER123"
            };
            var booking = new Booking { Id = bookingId, Status = BookingStatus.InProgress };

            SetupRepository(_mockPaymentRepository, new List<Payment> { payment });
            SetupRepository(_mockBookingRepository, new List<Booking> { booking });

            _mockSePayService.Setup(s => s.QueryPaymentStatusAsync("ORDER123"))
                .ReturnsAsync(new SePayQueryResponse { Success = true, Status = "completed", TransactionRef = "REF123" });

            // Act
            var result = await _paymentService.QueryPaymentStatusAsync(paymentId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(PaymentStatus.Completed, result.Status);
            Assert.Equal(PaymentStatus.Completed, payment.Status); // Verify Entity updated
            Assert.Equal(BookingStatus.Completed, booking.Status); // Verify Booking updated
        }

        [Fact]
        public async Task QueryPaymentStatusAsync_ShouldReturnLocalDetail_WhenNoSePayOrderId()
        {
            // Arrange
            var pid = Guid.NewGuid();
            var payment = new Payment { Id = pid, SePayOrderId = null, Amount = 100 }; // Null OrderId

            SetupRepository(_mockPaymentRepository, new List<Payment> { payment });

            // Act
            var result = await _paymentService.QueryPaymentStatusAsync(pid);

            // Assert
            Assert.NotNull(result);
            // Verify: KHÔNG gọi SePay query
            _mockSePayService.Verify(s => s.QueryPaymentStatusAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task QueryPaymentStatusAsync_ShouldNotUpdateBooking_IfAlreadyCancelled()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();
            var payment = new Payment
            {
                Id = paymentId,
                BookingId = bookingId,
                Status = PaymentStatus.Processing,
                SePayOrderId = "ORDER_CHK"
            };
            // Booking đã bị hủy trước đó
            var booking = new Booking { Id = bookingId, Status = BookingStatus.Cancelled };

            SetupRepository(_mockPaymentRepository, new List<Payment> { payment });
            SetupRepository(_mockBookingRepository, new List<Booking> { booking });

            _mockSePayService.Setup(s => s.QueryPaymentStatusAsync("ORDER_CHK"))
                .ReturnsAsync(new SePayQueryResponse { Success = true, Status = "completed" });

            // Act
            await _paymentService.QueryPaymentStatusAsync(paymentId);

            // Assert
            Assert.Equal(PaymentStatus.Completed, payment.Status); // Payment vẫn update
            Assert.Equal(BookingStatus.Cancelled, booking.Status); // Booking KHÔNG đổi status

            // Verify: Booking Update KHÔNG được gọi
            _mockBookingRepository.Verify(r => r.Update(booking), Times.Never);
        }

        [Fact]
        public async Task QueryPaymentStatusAsync_ShouldNotUpdate_WhenSePayStatusIsNotCompleted()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var payment = new Payment
            {
                Id = paymentId,
                Status = PaymentStatus.Processing,
                SePayOrderId = "ORDER_PENDING"
            };

            SetupRepository(_mockPaymentRepository, new List<Payment> { payment });

            // Mock SePay trả về trạng thái vẫn đang chờ (chưa xong)
            _mockSePayService.Setup(s => s.QueryPaymentStatusAsync("ORDER_PENDING"))
                .ReturnsAsync(new SePayQueryResponse { Success = true, Status = "pending" });

            // Act
            var result = await _paymentService.QueryPaymentStatusAsync(paymentId);

            // Assert
            Assert.Equal(PaymentStatus.Processing, payment.Status); // Status cũ phải giữ nguyên
            _mockPaymentRepository.Verify(r => r.Update(payment), Times.Never); // Không được gọi update
        }

        #endregion

        #region GetPaymentByIdAsync Tests

        [Fact]
        public async Task GetPaymentByIdAsync_ShouldReturnNull_WhenNotFound()
        {
            SetupRepository(_mockPaymentRepository, new List<Payment>());
            var result = await _paymentService.GetPaymentByIdAsync(Guid.NewGuid());
            Assert.Null(result);
        }

        [Fact]
        public async Task GetPaymentByIdAsync_ShouldReturnDto_WhenFound()
        {
            var id = Guid.NewGuid();
            SetupRepository(_mockPaymentRepository, new List<Payment> { new Payment { Id = id, Amount = 100 } });

            var result = await _paymentService.GetPaymentByIdAsync(id);

            Assert.NotNull(result);
            Assert.Equal(100, result.Amount);
        }

        #endregion

        #region GetAllPaymentsAsync Tests

        [Fact]
        public async Task GetAllPaymentsAsync_ShouldFilterCorrectly()
        {
            // Arrange
            var bookingGuid = Guid.NewGuid();
            var customerGuid = Guid.NewGuid();

            var p1 = new Payment
            {
                Id = Guid.NewGuid(),
                BookingId = bookingGuid,
                Status = PaymentStatus.Completed,
                DateCreated = DateTime.UtcNow,
                Booking = new Booking { CustomerId = customerGuid }
            };

            var p2 = new Payment
            {
                Id = Guid.NewGuid(),
                BookingId = bookingGuid,
                Status = PaymentStatus.Pending,
                DateCreated = DateTime.UtcNow.AddDays(-1),
                Booking = new Booking { CustomerId = customerGuid }
            };

            SetupRepository(_mockPaymentRepository, new List<Payment> { p1, p2 });

            // FIX: Dùng PageNumber thay vì PageIndex
            var filter = new PaymentFilterDto
            {
                Status = PaymentStatus.Completed,
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _paymentService.GetAllPaymentsAsync(filter);

            // Assert
            // FIX: Truy cập vào property .Items để kiểm tra danh sách
            Assert.Single(result.Items);
            Assert.Equal(p1.Id, result.Items.First().Id);
            Assert.Equal(1, result.TotalCount);
        }

        [Fact]
        public async Task GetAllPaymentsAsync_ShouldApplyAllFilters_AndSearchTerms()
        {
            // Arrange: Tạo 3 payment với các đặc điểm khác nhau
            var dateNow = DateTime.UtcNow;
            var p1 = new Payment
            {
                Id = Guid.NewGuid(),
                Description = "Pay for HSP123",
                TransactionId = "TRANS_A",
                DateCreated = dateNow,
                Booking = new Booking { CustomerId = Guid.NewGuid() }
            };
            var p2 = new Payment
            {
                Id = Guid.NewGuid(),
                Description = "Other",
                TransactionId = "TRANS_B",
                DateCreated = dateNow.AddDays(-5), // Cũ hơn
                Booking = new Booking { CustomerId = Guid.NewGuid() }
            };
            var p3 = new Payment
            {
                Id = Guid.NewGuid(),
                Description = "Hidden",
                TransactionId = "TRANS_C",
                DateCreated = dateNow.AddDays(1), // Tương lai
                Booking = new Booking { CustomerId = Guid.NewGuid() }
            };

            SetupRepository(_mockPaymentRepository, new List<Payment> { p1, p2, p3 });

            // Case 1: Filter theo Date Range và Search Term "HSP" (chỉ p1 thỏa mãn)
            var filter1 = new PaymentFilterDto
            {
                FromDate = dateNow.AddDays(-1),
                ToDate = dateNow.AddDays(1),
                SearchTerm = "HSP", // Sẽ match vào Description của p1
                PageNumber = 1,
                PageSize = 10
            };

            // Act 1
            var result1 = await _paymentService.GetAllPaymentsAsync(filter1);

            // Assert 1
            Assert.Single(result1.Items);
            Assert.Equal(p1.Id, result1.Items.First().Id);

            // Case 2: Filter theo TransactionId (chỉ p2 thỏa mãn)
            var filter2 = new PaymentFilterDto
            {
                SearchTerm = "TRANS_B",
                PageNumber = 1,
                PageSize = 10
            };

            // Act 2
            var result2 = await _paymentService.GetAllPaymentsAsync(filter2);

            // Assert 2
            Assert.Single(result2.Items);
            Assert.Equal(p2.Id, result2.Items.First().Id);
        }

        #endregion

        #region UpdatePaymentStatusAsync Tests

        [Fact]
        public async Task UpdatePaymentStatusAsync_ShouldReturnFalse_WhenPaymentNotFound()
        {
            SetupRepository(_mockPaymentRepository, new List<Payment>());
            var result = await _paymentService.UpdatePaymentStatusAsync(new UpdatePaymentStatusDto { PaymentId = Guid.NewGuid() });
            Assert.False(result);
        }

        [Fact]
        public async Task UpdatePaymentStatusAsync_ShouldUpdateStatusAndCompleteBooking_WhenCompleted()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();
            var payment = new Payment { Id = paymentId, BookingId = bookingId, Status = PaymentStatus.Pending };

            SetupRepository(_mockPaymentRepository, new List<Payment> { payment });

            var input = new UpdatePaymentStatusDto
            {
                PaymentId = paymentId,
                Status = PaymentStatus.Completed,
                TransactionId = "TRANS_MANUAL"
            };

            // Act
            var result = await _paymentService.UpdatePaymentStatusAsync(input);

            // Assert
            Assert.True(result);
            Assert.Equal(PaymentStatus.Completed, payment.Status);
            Assert.Equal("TRANS_MANUAL", payment.TransactionId);
            Assert.NotNull(payment.PaidAt);

            // Verify booking service call
            _mockBookingService.Verify(s => s.TryCompleteBookingAsync(bookingId), Times.Once);
        }

        #endregion

        #region GetPaymentsByBookingIdAsync Tests

        [Fact]
        public async Task GetPaymentsByBookingIdAsync_ShouldReturnSortedList()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var p1 = new Payment { Id = Guid.NewGuid(), BookingId = bookingId, DateCreated = DateTime.UtcNow.AddHours(-1) };
            var p2 = new Payment { Id = Guid.NewGuid(), BookingId = bookingId, DateCreated = DateTime.UtcNow }; // Newer
            var p3 = new Payment { Id = Guid.NewGuid(), BookingId = Guid.NewGuid() }; // Other booking

            SetupRepository(_mockPaymentRepository, new List<Payment> { p1, p2, p3 });

            // Act
            var result = await _paymentService.GetPaymentsByBookingIdAsync(bookingId);

            // Assert
            Assert.Equal(2, result.Count);
            Assert.Equal(p2.Id, result[0].Id); // Should be ordered by descending date
        }

        [Fact]
        public async Task GetPaymentsByBookingIdAsync_ShouldExcludeDeletedPayments()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var activePayment = new Payment { Id = Guid.NewGuid(), BookingId = bookingId, IsDeleted = false };
            var deletedPayment = new Payment { Id = Guid.NewGuid(), BookingId = bookingId, IsDeleted = true }; // Đã xóa

            SetupRepository(_mockPaymentRepository, new List<Payment> { activePayment, deletedPayment });

            // Act
            var result = await _paymentService.GetPaymentsByBookingIdAsync(bookingId);

            // Assert
            Assert.Single(result); // Chỉ được trả về 1 item
            Assert.Equal(activePayment.Id, result[0].Id);
        }

        #endregion

    }
}