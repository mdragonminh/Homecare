using HSP.Core.Abstractions.External;
using HSP.Core.Dtos.ConfigurationDto;
using HSP.Core.Dtos.PaymentDto;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Implementations.Internal;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using System.Linq.Expressions;
using Xunit;

namespace HSP.Service.Test.Implementations.Internal
{
    public class PaymentServiceTests
    {
        private readonly Mock<IRepository<Payment, Guid>> _paymentRepositoryMock;
        private readonly Mock<IRepository<Booking, Guid>> _bookingRepositoryMock;
        private readonly Mock<ISePayService> _sePayServiceMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IStringLocalizer<SharedResource>> _localizerMock;
        private readonly PaymentService _paymentService;
        private readonly SePayConfigurationDto _sePayConfig;

        public PaymentServiceTests()
        {
            _paymentRepositoryMock = new Mock<IRepository<Payment, Guid>>();
            _bookingRepositoryMock = new Mock<IRepository<Booking, Guid>>();
            _sePayServiceMock = new Mock<ISePayService>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _localizerMock = new Mock<IStringLocalizer<SharedResource>>();

            _sePayConfig = new SePayConfigurationDto
            {
                ReturnUrl = "https://test.com/return",
                CallbackUrl = "https://test.com/callback"
            };

            var options = Options.Create(_sePayConfig);

            // Setup localizer to return the key as the value
            _localizerMock.Setup(l => l[It.IsAny<string>()])
                .Returns((string key) => new LocalizedString(key, key));
            _localizerMock.Setup(l => l[It.IsAny<string>(), It.IsAny<object[]>()])
                .Returns((string key, object[] args) => new LocalizedString(key, string.Format(key, args)));

            _paymentService = new PaymentService(
                _paymentRepositoryMock.Object,
                _bookingRepositoryMock.Object,
                _sePayServiceMock.Object,
                options,
                _unitOfWorkMock.Object,
                _localizerMock.Object
            );
        }

        #region Helper Methods

        private Booking CreateTestBooking(Guid? id = null, Guid? customerId = null)
        {
            return new Booking
            {
                Id = id ?? Guid.NewGuid(),
                CustomerId = customerId ?? Guid.NewGuid(),
                Status = BookingStatus.Confirmed,
                IsDeleted = false,
                Customer = new AppUser
                {
                    Id = customerId ?? Guid.NewGuid(),
                    FullName = "Test User",
                    Email = "test@test.com",
                    PhoneNumber = "0123456789"
                },
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow
            };
        }

        private Payment CreateTestPayment(Guid? id = null, Guid? bookingId = null, PaymentStatus status = PaymentStatus.Pending)
        {
            return new Payment
            {
                Id = id ?? Guid.NewGuid(),
                BookingId = bookingId ?? Guid.NewGuid(),
                Amount = 100000,
                PaymentMethod = PaymentMethod.BankTransfer,
                Status = status,
                IsDeleted = false,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow
            };
        }

        #endregion

        #region CreatePaymentAsync Tests

        [Fact]
        public async Task CreatePaymentAsync_BookingNotFound_ReturnsFailure()
        {
            // Arrange
            var createDto = new CreatePaymentDto
            {
                BookingId = Guid.NewGuid(),
                Amount = 100000,
                PaymentMethod = PaymentMethod.BankTransfer
            };

            var emptyBookings = new List<Booking>().BuildMock();
            _bookingRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(emptyBookings);

            // Act
            var result = await _paymentService.CreatePaymentAsync(createDto, "user123");

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Booking not found", result.Message);
            _paymentRepositoryMock.Verify(r => r.AddAsync(It.IsAny<Payment>()), Times.Never);
        }

        [Fact]
        public async Task CreatePaymentAsync_BookingAlreadyHasCompletedPayment_ReturnsFailure()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var booking = CreateTestBooking(bookingId);

            var existingPayment = CreateTestPayment(bookingId: bookingId, status: PaymentStatus.Completed);

            var bookings = new List<Booking> { booking }.BuildMock();
            var payments = new List<Payment> { existingPayment }.BuildMock();

            _bookingRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings);
            _paymentRepositoryMock.Setup(r => r.GetAll())
                .Returns(payments);

            var createDto = new CreatePaymentDto
            {
                BookingId = bookingId,
                Amount = 100000,
                PaymentMethod = PaymentMethod.BankTransfer
            };

            // Act
            var result = await _paymentService.CreatePaymentAsync(createDto, "user123");

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Booking already has a completed payment", result.Message);
            _paymentRepositoryMock.Verify(r => r.AddAsync(It.IsAny<Payment>()), Times.Never);
        }

        [Fact]
        public async Task CreatePaymentAsync_CashPayment_CreatesSuccessfully()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var booking = CreateTestBooking(bookingId);

            var bookings = new List<Booking> { booking }.BuildMock();
            var emptyPayments = new List<Payment>().BuildMock();

            _bookingRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings);
            _paymentRepositoryMock.Setup(r => r.GetAll())
                .Returns(emptyPayments);

            var createDto = new CreatePaymentDto
            {
                BookingId = bookingId,
                Amount = 100000,
                PaymentMethod = PaymentMethod.Cash,
                Description = "Test payment"
            };

            // Act
            var result = await _paymentService.CreatePaymentAsync(createDto, "user123");

            // Assert
            Assert.True(result.Success);
            Assert.Equal("Payment created successfully", result.Message);
            Assert.NotNull(result.Payment);
            Assert.Equal(createDto.Amount, result.Payment.Amount);
            Assert.Equal(PaymentMethod.Cash, result.Payment.PaymentMethod);
            Assert.Equal(PaymentStatus.Pending, result.Payment.Status);

            _paymentRepositoryMock.Verify(r => r.AddAsync(It.Is<Payment>(p =>
                p.BookingId == bookingId &&
                p.Amount == createDto.Amount &&
                p.PaymentMethod == PaymentMethod.Cash &&
                p.Status == PaymentStatus.Pending
            )), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Theory]
        [InlineData(PaymentMethod.BankTransfer)]
        [InlineData(PaymentMethod.QRCode)]
        [InlineData(PaymentMethod.EWallet)]
        public async Task CreatePaymentAsync_NonCashPaymentMethods_CreatesSePayOrder_Success(PaymentMethod paymentMethod)
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var booking = CreateTestBooking(bookingId);

            var bookings = new List<Booking> { booking }.BuildMock();
            var emptyPayments = new List<Payment>().BuildMock();

            _bookingRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings);
            _paymentRepositoryMock.Setup(r => r.GetAll())
                .Returns(emptyPayments);

            var sePayResponse = new SePayCreateOrderResponse
            {
                Success = true,
                OrderId = "HSP12345678",
                PaymentUrl = "https://sepay.com/pay/123",
                QrCode = "data:image/png;base64,..."
            };

            _sePayServiceMock.Setup(s => s.CreatePaymentOrderAsync(It.IsAny<SePayCreateOrderRequest>()))
                .ReturnsAsync(sePayResponse);

            var createDto = new CreatePaymentDto
            {
                BookingId = bookingId,
                Amount = 100000,
                PaymentMethod = paymentMethod
            };

            // Act
            var result = await _paymentService.CreatePaymentAsync(createDto, "user123");

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.PaymentUrl);
            Assert.Equal(sePayResponse.PaymentUrl, result.PaymentUrl);
            Assert.NotNull(result.Payment);
            Assert.Equal(PaymentStatus.Processing, result.Payment.Status);
            Assert.Equal(paymentMethod, result.Payment.PaymentMethod);

            _paymentRepositoryMock.Verify(r => r.AddAsync(It.IsAny<Payment>()), Times.Once);
            _paymentRepositoryMock.Verify(r => r.Update(It.Is<Payment>(p =>
                p.SePayOrderId == sePayResponse.OrderId &&
                p.PaymentUrl == sePayResponse.PaymentUrl &&
                p.Status == PaymentStatus.Processing
            )), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Exactly(2));
        }

        [Fact]
        public async Task CreatePaymentAsync_SePayOrderCreationFails_ReturnsFailure()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var booking = CreateTestBooking(bookingId);

            var bookings = new List<Booking> { booking }.BuildMock();
            var emptyPayments = new List<Payment>().BuildMock();

            _bookingRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings);
            _paymentRepositoryMock.Setup(r => r.GetAll())
                .Returns(emptyPayments);

            var sePayResponse = new SePayCreateOrderResponse
            {
                Success = false,
                Message = "SePay service unavailable"
            };

            _sePayServiceMock.Setup(s => s.CreatePaymentOrderAsync(It.IsAny<SePayCreateOrderRequest>()))
                .ReturnsAsync(sePayResponse);

            var createDto = new CreatePaymentDto
            {
                BookingId = bookingId,
                Amount = 100000,
                PaymentMethod = PaymentMethod.BankTransfer
            };

            // Act
            var result = await _paymentService.CreatePaymentAsync(createDto, "user123");

            // Assert
            Assert.False(result.Success);
            Assert.Contains("Failed to create payment", result.Message);

            _paymentRepositoryMock.Verify(r => r.Update(It.Is<Payment>(p =>
                p.Status == PaymentStatus.Failed &&
                p.FailureReason == sePayResponse.Message
            )), Times.Once);
        }

        [Fact]
        public async Task CreatePaymentAsync_WithDescription_UsesProvidedDescription()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var booking = CreateTestBooking(bookingId);
            var customDescription = "Custom payment description";

            var bookings = new List<Booking> { booking }.BuildMock();
            var emptyPayments = new List<Payment>().BuildMock();

            _bookingRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings);
            _paymentRepositoryMock.Setup(r => r.GetAll())
                .Returns(emptyPayments);

            var createDto = new CreatePaymentDto
            {
                BookingId = bookingId,
                Amount = 100000,
                PaymentMethod = PaymentMethod.Cash,
                Description = customDescription
            };

            // Act
            var result = await _paymentService.CreatePaymentAsync(createDto, "user123");

            // Assert
            Assert.True(result.Success);
            Assert.Equal(customDescription, result.Payment?.Description);
        }

        #endregion

        #region GetPaymentByIdAsync Tests

        [Fact]
        public async Task GetPaymentByIdAsync_PaymentExists_ReturnsPaymentDetail()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();
            var payment = CreateTestPayment(paymentId, bookingId, PaymentStatus.Completed);
            payment.TransactionId = "TXN123";
            payment.PaidAt = DateTime.UtcNow;
            payment.Description = "Test payment";

            var payments = new List<Payment> { payment }.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(payments);

            // Act
            var result = await _paymentService.GetPaymentByIdAsync(paymentId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(paymentId, result.Id);
            Assert.Equal(bookingId, result.BookingId);
            Assert.Equal(payment.Amount, result.Amount);
            Assert.Equal(payment.Status, result.Status);
            Assert.Equal(payment.TransactionId, result.TransactionId);
            Assert.Equal(payment.Description, result.Description);
        }

        [Fact]
        public async Task GetPaymentByIdAsync_PaymentNotFound_ReturnsNull()
        {
            // Arrange
            var emptyPayments = new List<Payment>().BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(emptyPayments);

            // Act
            var result = await _paymentService.GetPaymentByIdAsync(Guid.NewGuid());

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task GetPaymentByIdAsync_DeletedPayment_ReturnsNull()
        {
            // Arrange
            var payment = CreateTestPayment();
            payment.IsDeleted = true;

            var payments = new List<Payment> { payment }.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(payments);

            // Act
            var result = await _paymentService.GetPaymentByIdAsync(payment.Id);

            // Assert
            Assert.Null(result);
        }

        #endregion

        #region GetPaymentsByBookingIdAsync Tests

        [Fact]
        public async Task GetPaymentsByBookingIdAsync_ReturnsPaymentsOrderedByDateDescending()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var payment1 = CreateTestPayment(bookingId: bookingId);
            payment1.DateCreated = DateTime.UtcNow.AddDays(-2);

            var payment2 = CreateTestPayment(bookingId: bookingId);
            payment2.DateCreated = DateTime.UtcNow.AddDays(-1);

            var payment3 = CreateTestPayment(bookingId: bookingId);
            payment3.DateCreated = DateTime.UtcNow;

            var payments = new List<Payment> { payment1, payment2, payment3 }.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll())
                .Returns(payments);

            // Act
            var result = await _paymentService.GetPaymentsByBookingIdAsync(bookingId);

            // Assert
            Assert.Equal(3, result.Count);
            Assert.True(result[0].DateCreated >= result[1].DateCreated);
            Assert.True(result[1].DateCreated >= result[2].DateCreated);
        }

        [Fact]
        public async Task GetPaymentsByBookingIdAsync_ExcludesDeletedPayments()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var activePayment = CreateTestPayment(bookingId: bookingId);
            activePayment.IsDeleted = false;

            var deletedPayment = CreateTestPayment(bookingId: bookingId);
            deletedPayment.IsDeleted = true;

            var payments = new List<Payment> { activePayment, deletedPayment }.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll())
                .Returns(payments);

            // Act
            var result = await _paymentService.GetPaymentsByBookingIdAsync(bookingId);

            // Assert
            Assert.Single(result);
            Assert.Equal(activePayment.Id, result[0].Id);
        }

        #endregion

        #region HandleSePayWebhookAsync Tests

        [Fact]
        public async Task HandleSePayWebhookAsync_NullWebhook_ReturnsFalse()
        {
            // Act
            var result = await _paymentService.HandleSePayWebhookAsync(null);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task HandleSePayWebhookAsync_NoPaymentCodeInContent_ReturnsFalse()
        {
            // Arrange
            var webhook = new SePayWebhookDto
            {
                Content = "Random content without payment code",
                TransferAmount = 100000,
                Id = 12345
            };

            // Act
            var result = await _paymentService.HandleSePayWebhookAsync(webhook);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task HandleSePayWebhookAsync_PaymentCodeNotFound_ReturnsFalse()
        {
            // Arrange
            var paymentCode = "HSP12345678";
            var webhook = new SePayWebhookDto
            {
                Content = $"Transfer from bank - {paymentCode}",
                TransferAmount = 100000,
                Id = 12345
            };

            var emptyPayments = new List<Payment>().BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll())
                .Returns(emptyPayments);

            // Act
            var result = await _paymentService.HandleSePayWebhookAsync(webhook);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task HandleSePayWebhookAsync_ValidWebhook_UpdatesPaymentAndBookingSuccessfully()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();
            var paymentCode = "HSP12345678";

            var payment = CreateTestPayment(paymentId, bookingId, PaymentStatus.Processing);
            payment.SePayOrderId = paymentCode;
            payment.Amount = 100000;

            var booking = CreateTestBooking(bookingId);
            booking.Status = BookingStatus.Confirmed;

            var payments = new List<Payment> { payment }.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll())
                .Returns(payments);
            _bookingRepositoryMock.Setup(r => r.GetByIdAsync(bookingId))
                .ReturnsAsync(booking);

            var webhook = new SePayWebhookDto
            {
                Id = 123456,
                Content = $"Transfer from VCB - Code: {paymentCode}",
                TransferAmount = 100000,
                ReferenceCode = "REF123456",
                Gateway = "VCB",
                TransactionDate = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss")
            };

            // Act
            var result = await _paymentService.HandleSePayWebhookAsync(webhook);

            // Assert
            Assert.True(result);

            _paymentRepositoryMock.Verify(r => r.Update(It.Is<Payment>(p =>
                p.Status == PaymentStatus.Completed &&
                p.PaidAt != null &&
                p.TransactionId == webhook.Id.ToString() &&
                p.SePayTransactionRef == webhook.ReferenceCode
            )), Times.Once);

            _bookingRepositoryMock.Verify(r => r.Update(It.Is<Booking>(b =>
                b.Status == BookingStatus.Completed
            )), Times.Once);

            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task HandleSePayWebhookAsync_AmountMismatch_FailsPayment()
        {
            // Arrange
            var paymentCode = "HSP12345678";
            var payment = CreateTestPayment(status: PaymentStatus.Processing);
            payment.SePayOrderId = paymentCode;
            payment.Amount = 100000;

            var payments = new List<Payment> { payment }.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll())
                .Returns(payments);

            var webhook = new SePayWebhookDto
            {
                Id = 123456,
                Content = $"Transfer - {paymentCode}",
                TransferAmount = 200000 // Different amount
            };

            // Act
            var result = await _paymentService.HandleSePayWebhookAsync(webhook);

            // Assert
            Assert.False(result);

            _paymentRepositoryMock.Verify(r => r.Update(It.Is<Payment>(p =>
                p.Status == PaymentStatus.Failed &&
                p.FailureReason != null &&
                p.FailureReason.Contains("Amount mismatch")
            )), Times.Once);
        }

        [Fact]
        public async Task HandleSePayWebhookAsync_AlreadyCompleted_ReturnsTrue_NoUpdate()
        {
            // Arrange
            var paymentCode = "HSP12345678";
            var payment = CreateTestPayment(status: PaymentStatus.Completed);
            payment.SePayOrderId = paymentCode;
            payment.Amount = 100000;

            var payments = new List<Payment> { payment }.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll())
                .Returns(payments);

            var webhook = new SePayWebhookDto
            {
                Id = 123456,
                Content = $"Transfer - {paymentCode}",
                TransferAmount = 100000
            };

            // Act
            var result = await _paymentService.HandleSePayWebhookAsync(webhook);

            // Assert
            Assert.True(result);
            _paymentRepositoryMock.Verify(r => r.Update(It.IsAny<Payment>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task HandleSePayWebhookAsync_BookingAlreadyCompleted_DoesNotUpdateBooking()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();
            var paymentCode = "HSP12345678";

            var payment = CreateTestPayment(paymentId, bookingId, PaymentStatus.Processing);
            payment.SePayOrderId = paymentCode;
            payment.Amount = 100000;

            var booking = CreateTestBooking(bookingId);
            booking.Status = BookingStatus.Completed; // Already completed

            var payments = new List<Payment> { payment }.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll())
                .Returns(payments);
            _bookingRepositoryMock.Setup(r => r.GetByIdAsync(bookingId))
                .ReturnsAsync(booking);

            var webhook = new SePayWebhookDto
            {
                Id = 123456,
                Content = $"Transfer - {paymentCode}",
                TransferAmount = 100000
            };

            // Act
            var result = await _paymentService.HandleSePayWebhookAsync(webhook);

            // Assert
            Assert.True(result);
            _bookingRepositoryMock.Verify(r => r.Update(It.IsAny<Booking>()), Times.Never);
        }

        [Theory]
        [InlineData("Transfer from VCB HSP12345678")]
        [InlineData("Payment HSPabcd1234 received")]
        [InlineData("Code: HSP99999999")]
        [InlineData("HSP12AB34CD")]
        public async Task HandleSePayWebhookAsync_VariousPaymentCodeFormats_ExtractsCorrectly(string content)
        {
            // Arrange
            var paymentCode = System.Text.RegularExpressions.Regex.Match(content, @"HSP[A-Za-z0-9]{8}").Value;
            var payment = CreateTestPayment(status: PaymentStatus.Processing);
            payment.SePayOrderId = paymentCode;
            payment.Amount = 100000;

            var payments = new List<Payment> { payment }.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll())
                .Returns(payments);
            _bookingRepositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(CreateTestBooking());

            var webhook = new SePayWebhookDto
            {
                Id = 123456,
                Content = content,
                TransferAmount = 100000
            };

            // Act
            var result = await _paymentService.HandleSePayWebhookAsync(webhook);

            // Assert
            Assert.True(result);
        }

        #endregion

        #region HandlePaymentCallbackAsync Tests

        [Fact]
        public async Task HandlePaymentCallbackAsync_InvalidSignature_ReturnsFalse()
        {
            // Arrange
            var callback = new PaymentCallbackDto
            {
                OrderId = Guid.NewGuid().ToString(),
                Status = "success",
                Signature = "invalid"
            };

            _sePayServiceMock.Setup(s => s.VerifyCallbackSignature(callback))
                .Returns(false);

            // Act
            var result = await _paymentService.HandlePaymentCallbackAsync(callback);

            // Assert
            Assert.False(result);
            _paymentRepositoryMock.Verify(r => r.Update(It.IsAny<Payment>()), Times.Never);
        }

        [Fact]
        public async Task HandlePaymentCallbackAsync_InvalidOrderId_ReturnsFalse()
        {
            // Arrange
            var callback = new PaymentCallbackDto
            {
                OrderId = "not-a-guid",
                Status = "success"
            };

            _sePayServiceMock.Setup(s => s.VerifyCallbackSignature(callback))
                .Returns(true);

            // Act
            var result = await _paymentService.HandlePaymentCallbackAsync(callback);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task HandlePaymentCallbackAsync_PaymentNotFound_ReturnsFalse()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var callback = new PaymentCallbackDto
            {
                OrderId = paymentId.ToString(),
                Status = "success"
            };

            _sePayServiceMock.Setup(s => s.VerifyCallbackSignature(callback))
                .Returns(true);
            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(paymentId))
                .ReturnsAsync((Payment)null);

            // Act
            var result = await _paymentService.HandlePaymentCallbackAsync(callback);

            // Assert
            Assert.False(result);
        }

        [Theory]
        [InlineData("success")]
        [InlineData("completed")]
        [InlineData("SUCCESS")]
        [InlineData("COMPLETED")]
        public async Task HandlePaymentCallbackAsync_SuccessStatus_UpdatesPaymentAndBooking(string status)
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();

            var payment = CreateTestPayment(paymentId, bookingId, PaymentStatus.Processing);
            var booking = CreateTestBooking(bookingId);

            _sePayServiceMock.Setup(s => s.VerifyCallbackSignature(It.IsAny<PaymentCallbackDto>()))
                .Returns(true);
            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(paymentId))
                .ReturnsAsync(payment);
            _bookingRepositoryMock.Setup(r => r.GetByIdAsync(bookingId))
                .ReturnsAsync(booking);

            var callback = new PaymentCallbackDto
            {
                OrderId = paymentId.ToString(),
                Status = status,
                TransactionRef = "TXN123456",
                Amount = payment.Amount
            };

            // Act
            var result = await _paymentService.HandlePaymentCallbackAsync(callback);

            // Assert
            Assert.True(result);

            _paymentRepositoryMock.Verify(r => r.Update(It.Is<Payment>(p =>
                p.Status == PaymentStatus.Completed &&
                p.PaidAt != null &&
                p.TransactionId == callback.TransactionRef &&
                p.SePayTransactionRef == callback.TransactionRef
            )), Times.Once);

            _bookingRepositoryMock.Verify(r => r.Update(It.Is<Booking>(b =>
                b.Status == BookingStatus.Completed
            )), Times.Once);
        }

        [Fact]
        public async Task HandlePaymentCallbackAsync_FailedStatus_UpdatesPaymentStatus()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var payment = CreateTestPayment(paymentId, status: PaymentStatus.Processing);

            _sePayServiceMock.Setup(s => s.VerifyCallbackSignature(It.IsAny<PaymentCallbackDto>()))
                .Returns(true);
            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(paymentId))
                .ReturnsAsync(payment);

            var callback = new PaymentCallbackDto
            {
                OrderId = paymentId.ToString(),
                Status = "failed",
                Message = "Payment processing failed"
            };

            // Act
            var result = await _paymentService.HandlePaymentCallbackAsync(callback);

            // Assert
            Assert.True(result);

            _paymentRepositoryMock.Verify(r => r.Update(It.Is<Payment>(p =>
                p.Status == PaymentStatus.Failed &&
                p.FailureReason == callback.Message
            )), Times.Once);
        }

        [Fact]
        public async Task HandlePaymentCallbackAsync_CancelledStatus_UpdatesPaymentStatus()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var payment = CreateTestPayment(paymentId, status: PaymentStatus.Processing);

            _sePayServiceMock.Setup(s => s.VerifyCallbackSignature(It.IsAny<PaymentCallbackDto>()))
                .Returns(true);
            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(paymentId))
                .ReturnsAsync(payment);

            var callback = new PaymentCallbackDto
            {
                OrderId = paymentId.ToString(),
                Status = "cancelled",
                Message = "Payment cancelled by user"
            };

            // Act
            var result = await _paymentService.HandlePaymentCallbackAsync(callback);

            // Assert
            Assert.True(result);

            _paymentRepositoryMock.Verify(r => r.Update(It.Is<Payment>(p =>
                p.Status == PaymentStatus.Cancelled
            )), Times.Once);
        }

        #endregion

        #region UpdatePaymentStatusAsync Tests

        [Fact]
        public async Task UpdatePaymentStatusAsync_PaymentNotFound_ReturnsFalse()
        {
            // Arrange
            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((Payment)null);

            var updateDto = new UpdatePaymentStatusDto
            {
                PaymentId = Guid.NewGuid(),
                Status = PaymentStatus.Completed
            };

            // Act
            var result = await _paymentService.UpdatePaymentStatusAsync(updateDto);

            // Assert
            Assert.False(result);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task UpdatePaymentStatusAsync_CompletedStatus_UpdatesPaymentAndBooking()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();

            var payment = CreateTestPayment(paymentId, bookingId, PaymentStatus.Pending);
            var booking = CreateTestBooking(bookingId);

            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(paymentId))
                .ReturnsAsync(payment);
            _bookingRepositoryMock.Setup(r => r.GetByIdAsync(bookingId))
                .ReturnsAsync(booking);

            var updateDto = new UpdatePaymentStatusDto
            {
                PaymentId = paymentId,
                Status = PaymentStatus.Completed,
                TransactionId = "TXN123"
            };

            // Act
            var result = await _paymentService.UpdatePaymentStatusAsync(updateDto);

            // Assert
            Assert.True(result);

            _paymentRepositoryMock.Verify(r => r.Update(It.Is<Payment>(p =>
                p.Status == PaymentStatus.Completed &&
                p.PaidAt != null &&
                p.TransactionId == updateDto.TransactionId
            )), Times.Once);

            _bookingRepositoryMock.Verify(r => r.Update(It.Is<Booking>(b =>
                b.Status == BookingStatus.Completed
            )), Times.Once);

            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task UpdatePaymentStatusAsync_FailedStatus_UpdatesWithReason()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var payment = CreateTestPayment(paymentId, status: PaymentStatus.Processing);

            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(paymentId))
                .ReturnsAsync(payment);

            var updateDto = new UpdatePaymentStatusDto
            {
                PaymentId = paymentId,
                Status = PaymentStatus.Failed,
                FailureReason = "Insufficient funds"
            };

            // Act
            var result = await _paymentService.UpdatePaymentStatusAsync(updateDto);

            // Assert
            Assert.True(result);

            _paymentRepositoryMock.Verify(r => r.Update(It.Is<Payment>(p =>
                p.Status == PaymentStatus.Failed &&
                p.FailureReason == updateDto.FailureReason
            )), Times.Once);
        }

        [Fact]
        public async Task UpdatePaymentStatusAsync_NonCompletedStatus_DoesNotUpdateBooking()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var payment = CreateTestPayment(paymentId, status: PaymentStatus.Pending);

            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(paymentId))
                .ReturnsAsync(payment);

            var updateDto = new UpdatePaymentStatusDto
            {
                PaymentId = paymentId,
                Status = PaymentStatus.Processing
            };

            // Act
            var result = await _paymentService.UpdatePaymentStatusAsync(updateDto);

            // Assert
            Assert.True(result);
            _bookingRepositoryMock.Verify(r => r.GetByIdAsync(It.IsAny<Guid>()), Times.Never);
            _bookingRepositoryMock.Verify(r => r.Update(It.IsAny<Booking>()), Times.Never);
        }

        #endregion

        #region RefundPaymentAsync Tests

        [Fact]
        public async Task RefundPaymentAsync_PaymentNotFound_ReturnsFalse()
        {
            // Arrange
            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((Payment)null);

            var refundDto = new RefundPaymentDto
            {
                PaymentId = Guid.NewGuid(),
                Reason = "Customer request"
            };

            // Act
            var result = await _paymentService.RefundPaymentAsync(refundDto, "user123");

            // Assert
            Assert.False(result);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task RefundPaymentAsync_PaymentNotCompleted_ReturnsFalse()
        {
            // Arrange
            var payment = CreateTestPayment(status: PaymentStatus.Pending);

            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(payment);

            var refundDto = new RefundPaymentDto
            {
                PaymentId = payment.Id,
                Reason = "Customer request"
            };

            // Act
            var result = await _paymentService.RefundPaymentAsync(refundDto, "user123");

            // Assert
            Assert.False(result);
            _paymentRepositoryMock.Verify(r => r.Update(It.IsAny<Payment>()), Times.Never);
        }

        [Fact]
        public async Task RefundPaymentAsync_CashPayment_RefundsSuccessfully()
        {
            // Arrange
            var payment = CreateTestPayment(status: PaymentStatus.Completed);
            payment.PaymentMethod = PaymentMethod.Cash;
            payment.Amount = 100000;

            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(payment);

            var refundDto = new RefundPaymentDto
            {
                PaymentId = payment.Id,
                Reason = "Customer request"
            };

            // Act
            var result = await _paymentService.RefundPaymentAsync(refundDto, "user123");

            // Assert
            Assert.True(result);

            _paymentRepositoryMock.Verify(r => r.Update(It.Is<Payment>(p =>
                p.Status == PaymentStatus.Refunded &&
                p.RefundedAt != null &&
                p.RefundReason == refundDto.Reason
            )), Times.Once);

            _sePayServiceMock.Verify(s => s.RefundPaymentAsync(It.IsAny<SePayRefundRequest>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task RefundPaymentAsync_BankTransferPayment_CallsSePayRefund_Success()
        {
            // Arrange
            var payment = CreateTestPayment(status: PaymentStatus.Completed);
            payment.PaymentMethod = PaymentMethod.BankTransfer;
            payment.Amount = 100000;
            payment.SePayOrderId = "HSP12345678";
            payment.SePayTransactionRef = "TXN123";

            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(payment);

            _sePayServiceMock.Setup(s => s.RefundPaymentAsync(It.IsAny<SePayRefundRequest>()))
                .ReturnsAsync(new SePayRefundResponse
                {
                    Success = true,
                    RefundId = "REF123"
                });

            var refundDto = new RefundPaymentDto
            {
                PaymentId = payment.Id,
                Reason = "Customer request"
            };

            // Act
            var result = await _paymentService.RefundPaymentAsync(refundDto, "user123");

            // Assert
            Assert.True(result);

            _sePayServiceMock.Verify(s => s.RefundPaymentAsync(It.Is<SePayRefundRequest>(r =>
                r.OrderId == payment.SePayOrderId &&
                r.TransactionRef == payment.SePayTransactionRef &&
                r.Amount == payment.Amount &&
                r.Reason == refundDto.Reason
            )), Times.Once);

            _paymentRepositoryMock.Verify(r => r.Update(It.Is<Payment>(p =>
                p.Status == PaymentStatus.Refunded
            )), Times.Once);
        }

        [Fact]
        public async Task RefundPaymentAsync_SePayRefundFails_ReturnsFalse()
        {
            // Arrange
            var payment = CreateTestPayment(status: PaymentStatus.Completed);
            payment.PaymentMethod = PaymentMethod.BankTransfer;
            payment.SePayOrderId = "HSP12345678";
            payment.SePayTransactionRef = "TXN123";

            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(payment);

            _sePayServiceMock.Setup(s => s.RefundPaymentAsync(It.IsAny<SePayRefundRequest>()))
                .ReturnsAsync(new SePayRefundResponse
                {
                    Success = false,
                    Message = "Refund failed"
                });

            var refundDto = new RefundPaymentDto
            {
                PaymentId = payment.Id,
                Reason = "Customer request"
            };

            // Act
            var result = await _paymentService.RefundPaymentAsync(refundDto, "user123");

            // Assert
            Assert.False(result);
            _paymentRepositoryMock.Verify(r => r.Update(It.IsAny<Payment>()), Times.Never);
        }

        [Theory]
        [InlineData(PaymentMethod.QRCode)]
        [InlineData(PaymentMethod.EWallet)]
        public async Task RefundPaymentAsync_NonCashPaymentMethods_CallsSePayRefund(PaymentMethod paymentMethod)
        {
            // Arrange
            var payment = CreateTestPayment(status: PaymentStatus.Completed);
            payment.PaymentMethod = paymentMethod;
            payment.SePayOrderId = "HSP12345678";
            payment.SePayTransactionRef = "TXN123";

            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(payment);

            _sePayServiceMock.Setup(s => s.RefundPaymentAsync(It.IsAny<SePayRefundRequest>()))
                .ReturnsAsync(new SePayRefundResponse { Success = true });

            var refundDto = new RefundPaymentDto
            {
                PaymentId = payment.Id,
                Reason = "Customer request"
            };

            // Act
            var result = await _paymentService.RefundPaymentAsync(refundDto, "user123");

            // Assert
            Assert.True(result);
            _sePayServiceMock.Verify(s => s.RefundPaymentAsync(It.IsAny<SePayRefundRequest>()), Times.Once);
        }

        [Fact]
        public async Task RefundPaymentAsync_BankTransferWithoutSePayRef_RefundsWithoutCallingSePayService()
        {
            // Arrange
            var payment = CreateTestPayment(status: PaymentStatus.Completed);
            payment.PaymentMethod = PaymentMethod.BankTransfer;
            payment.SePayOrderId = "HSP12345678";
            payment.SePayTransactionRef = null; // No transaction ref

            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(payment);

            var refundDto = new RefundPaymentDto
            {
                PaymentId = payment.Id,
                Reason = "Customer request"
            };

            // Act
            var result = await _paymentService.RefundPaymentAsync(refundDto, "user123");

            // Assert
            Assert.True(result);
            _sePayServiceMock.Verify(s => s.RefundPaymentAsync(It.IsAny<SePayRefundRequest>()), Times.Never);
            _paymentRepositoryMock.Verify(r => r.Update(It.Is<Payment>(p =>
                p.Status == PaymentStatus.Refunded &&
                p.RefundedAt != null &&
                p.RefundReason == refundDto.Reason
            )), Times.Once);
        }

        #endregion

        #region QueryPaymentStatusAsync Tests

        [Fact]
        public async Task QueryPaymentStatusAsync_PaymentNotFound_ReturnsNull()
        {
            // Arrange
            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((Payment)null);

            var emptyPayments = new List<Payment>().BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(emptyPayments);

            // Act
            var result = await _paymentService.QueryPaymentStatusAsync(Guid.NewGuid());

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task QueryPaymentStatusAsync_PaymentWithoutSePayOrderId_ReturnsLocalStatus()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var payment = CreateTestPayment(paymentId, status: PaymentStatus.Pending);
            payment.SePayOrderId = null;

            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(paymentId))
                .ReturnsAsync(payment);

            var payments = new List<Payment> { payment }.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(payments);

            // Act
            var result = await _paymentService.QueryPaymentStatusAsync(paymentId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(paymentId, result.Id);
            Assert.Equal(PaymentStatus.Pending, result.Status);
            _sePayServiceMock.Verify(s => s.QueryPaymentStatusAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task QueryPaymentStatusAsync_SePayReturnsCompleted_UpdatesLocalPaymentAndBooking()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();
            var payment = CreateTestPayment(paymentId, bookingId, PaymentStatus.Processing);
            payment.SePayOrderId = "HSP12345678";

            var booking = CreateTestBooking(bookingId);

            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(paymentId))
                .ReturnsAsync(payment);
            _bookingRepositoryMock.Setup(r => r.GetByIdAsync(bookingId))
                .ReturnsAsync(booking);

            // First call for query, second call after update
            var payments = new List<Payment> { payment }.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(payments);

            var queryResponse = new SePayQueryResponse
            {
                Success = true,
                Status = "completed",
                TransactionRef = "TXN123",
                Amount = payment.Amount,
                PaidAt = DateTime.UtcNow
            };

            _sePayServiceMock.Setup(s => s.QueryPaymentStatusAsync(payment.SePayOrderId))
                .ReturnsAsync(queryResponse);

            // Act
            var result = await _paymentService.QueryPaymentStatusAsync(paymentId);

            // Assert
            Assert.NotNull(result);

            _sePayServiceMock.Verify(s => s.QueryPaymentStatusAsync(payment.SePayOrderId), Times.Once);

            _paymentRepositoryMock.Verify(r => r.Update(It.Is<Payment>(p =>
                p.Status == PaymentStatus.Completed &&
                p.PaidAt != null &&
                p.TransactionId == queryResponse.TransactionRef
            )), Times.Once);

            _bookingRepositoryMock.Verify(r => r.Update(It.Is<Booking>(b =>
                b.Status == BookingStatus.Completed
            )), Times.Once);

            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task QueryPaymentStatusAsync_SePayReturnsNonCompleted_DoesNotUpdate()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var payment = CreateTestPayment(paymentId, status: PaymentStatus.Processing);
            payment.SePayOrderId = "HSP12345678";

            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(paymentId))
                .ReturnsAsync(payment);

            var payments = new List<Payment> { payment }.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(payments);

            var queryResponse = new SePayQueryResponse
            {
                Success = true,
                Status = "pending",
                Amount = payment.Amount
            };

            _sePayServiceMock.Setup(s => s.QueryPaymentStatusAsync(payment.SePayOrderId))
                .ReturnsAsync(queryResponse);

            // Act
            var result = await _paymentService.QueryPaymentStatusAsync(paymentId);

            // Assert
            Assert.NotNull(result);
            _paymentRepositoryMock.Verify(r => r.Update(It.IsAny<Payment>()), Times.Never);
        }

        [Fact]
        public async Task QueryPaymentStatusAsync_SePayQueryFails_ReturnsLocalStatus()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var payment = CreateTestPayment(paymentId, status: PaymentStatus.Processing);
            payment.SePayOrderId = "HSP12345678";

            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(paymentId))
                .ReturnsAsync(payment);

            var payments = new List<Payment> { payment }.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(payments);

            var queryResponse = new SePayQueryResponse
            {
                Success = false,
                Message = "Query failed"
            };

            _sePayServiceMock.Setup(s => s.QueryPaymentStatusAsync(payment.SePayOrderId))
                .ReturnsAsync(queryResponse);

            // Act
            var result = await _paymentService.QueryPaymentStatusAsync(paymentId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(PaymentStatus.Processing, result.Status);
            _paymentRepositoryMock.Verify(r => r.Update(It.IsAny<Payment>()), Times.Never);
        }

        [Fact]
        public async Task QueryPaymentStatusAsync_PaymentAlreadyCompleted_DoesNotQuerySePay()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var payment = CreateTestPayment(paymentId, status: PaymentStatus.Completed);
            payment.SePayOrderId = "HSP12345678";

            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(paymentId))
                .ReturnsAsync(payment);

            var payments = new List<Payment> { payment }.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(payments);

            var queryResponse = new SePayQueryResponse
            {
                Success = true,
                Status = "completed"
            };

            _sePayServiceMock.Setup(s => s.QueryPaymentStatusAsync(payment.SePayOrderId))
                .ReturnsAsync(queryResponse);

            // Act
            var result = await _paymentService.QueryPaymentStatusAsync(paymentId);

            // Assert
            Assert.NotNull(result);
            // Should still query SePay but not update since already completed
            _sePayServiceMock.Verify(s => s.QueryPaymentStatusAsync(payment.SePayOrderId), Times.Once);
            _paymentRepositoryMock.Verify(r => r.Update(It.IsAny<Payment>()), Times.Never);
        }

        #endregion

        #region GetAllPaymentsAsync Tests

        [Fact]
        public async Task GetAllPaymentsAsync_NoFilters_ReturnsAllPayments()
        {
            // Arrange
            var payments = new List<Payment>
            {
                CreateTestPayment(),
                CreateTestPayment(),
                CreateTestPayment()
            };

            var paymentsQueryable = payments.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(paymentsQueryable);

            var filter = new PaymentFilterDto
            {
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _paymentService.GetAllPaymentsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(3, result.TotalCount);
        }

        [Fact]
        public async Task GetAllPaymentsAsync_FilterByBookingId_ReturnsMatchingPayments()
        {
            // Arrange
            var targetBookingId = Guid.NewGuid();
            var payments = new List<Payment>
            {
                CreateTestPayment(bookingId: targetBookingId),
                CreateTestPayment(bookingId: targetBookingId),
                CreateTestPayment(bookingId: Guid.NewGuid()) // Different booking
            };

            var paymentsQueryable = payments.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(paymentsQueryable);

            var filter = new PaymentFilterDto
            {
                BookingId = targetBookingId,
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _paymentService.GetAllPaymentsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
            Assert.All(result.Items, p => Assert.Equal(targetBookingId, p.BookingId));
        }

        [Fact]
        public async Task GetAllPaymentsAsync_FilterByCustomerId_ReturnsMatchingPayments()
        {
            // Arrange
            var targetCustomerId = Guid.NewGuid();
            var otherCustomerId = Guid.NewGuid();

            var booking1 = CreateTestBooking(customerId: targetCustomerId);
            var booking2 = CreateTestBooking(customerId: otherCustomerId);

            var payments = new List<Payment>
            {
                CreateTestPayment(bookingId: booking1.Id),
                CreateTestPayment(bookingId: booking1.Id),
                CreateTestPayment(bookingId: booking2.Id)
            };

            payments[0].Booking = booking1;
            payments[1].Booking = booking1;
            payments[2].Booking = booking2;

            var paymentsQueryable = payments.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(paymentsQueryable);

            var filter = new PaymentFilterDto
            {
                CustomerId = targetCustomerId,
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _paymentService.GetAllPaymentsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
        }

        [Theory]
        [InlineData(PaymentStatus.Pending)]
        [InlineData(PaymentStatus.Processing)]
        [InlineData(PaymentStatus.Completed)]
        [InlineData(PaymentStatus.Failed)]
        public async Task GetAllPaymentsAsync_FilterByStatus_ReturnsMatchingPayments(PaymentStatus status)
        {
            // Arrange
            // Determine different statuses to use for non-matching payments
            var differentStatus1 = status == PaymentStatus.Pending ? PaymentStatus.Processing : PaymentStatus.Pending;
            var differentStatus2 = status == PaymentStatus.Completed ? PaymentStatus.Failed : PaymentStatus.Completed;

            var payments = new List<Payment>
            {
                CreateTestPayment(status: differentStatus1),
                CreateTestPayment(status: differentStatus2),
                CreateTestPayment(status: status),
                CreateTestPayment(status: status)
            };

            var paymentsQueryable = payments.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(paymentsQueryable);

            var filter = new PaymentFilterDto
            {
                Status = status,
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _paymentService.GetAllPaymentsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
            Assert.Equal(2, result.Items.Count);
            Assert.All(result.Items, p => Assert.Equal(status, p.Status));
        }

        [Theory]
        [InlineData(PaymentMethod.Cash)]
        [InlineData(PaymentMethod.BankTransfer)]
        [InlineData(PaymentMethod.QRCode)]
        [InlineData(PaymentMethod.EWallet)]
        public async Task GetAllPaymentsAsync_FilterByPaymentMethod_ReturnsMatchingPayments(PaymentMethod paymentMethod)
        {
            // Arrange
            var payments = new List<Payment>
            {
                CreateTestPayment(),
                CreateTestPayment(),
                CreateTestPayment()
            };
            payments[0].PaymentMethod = paymentMethod;
            payments[1].PaymentMethod = paymentMethod;
            // Set payment[2] to a different method to ensure filtering works
            payments[2].PaymentMethod = paymentMethod == PaymentMethod.Cash
                ? PaymentMethod.BankTransfer
                : PaymentMethod.Cash;

            var paymentsQueryable = payments.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(paymentsQueryable);

            var filter = new PaymentFilterDto
            {
                PaymentMethod = paymentMethod,
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _paymentService.GetAllPaymentsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
            Assert.Equal(2, result.Items.Count);
            Assert.All(result.Items, p => Assert.Equal(paymentMethod, p.PaymentMethod));
        }

        [Fact]
        public async Task GetAllPaymentsAsync_FilterByFromDate_ReturnsPaymentsAfterDate()
        {
            // Arrange
            var fromDate = DateTime.UtcNow.AddDays(-5);
            var payments = new List<Payment>
            {
                CreateTestPayment(),
                CreateTestPayment(),
                CreateTestPayment()
            };
            payments[0].DateCreated = fromDate.AddDays(-1); // Before fromDate
            payments[1].DateCreated = fromDate.AddDays(1);  // After fromDate
            payments[2].DateCreated = fromDate.AddDays(2);  // After fromDate

            var paymentsQueryable = payments.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(paymentsQueryable);

            var filter = new PaymentFilterDto
            {
                FromDate = fromDate,
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _paymentService.GetAllPaymentsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
            Assert.All(result.Items, p => Assert.True(p.DateCreated >= fromDate));
        }

        [Fact]
        public async Task GetAllPaymentsAsync_FilterByToDate_ReturnsPaymentsBeforeDate()
        {
            // Arrange
            var toDate = DateTime.UtcNow;
            var payments = new List<Payment>
            {
                CreateTestPayment(),
                CreateTestPayment(),
                CreateTestPayment()
            };
            payments[0].DateCreated = toDate.AddDays(-2); // Before toDate
            payments[1].DateCreated = toDate.AddDays(-1); // Before toDate
            payments[2].DateCreated = toDate.AddDays(1);  // After toDate

            var paymentsQueryable = payments.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(paymentsQueryable);

            var filter = new PaymentFilterDto
            {
                ToDate = toDate,
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _paymentService.GetAllPaymentsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
            Assert.All(result.Items, p => Assert.True(p.DateCreated <= toDate));
        }

        [Fact]
        public async Task GetAllPaymentsAsync_FilterByDateRange_ReturnsPaymentsInRange()
        {
            // Arrange
            var fromDate = DateTime.UtcNow.AddDays(-10);
            var toDate = DateTime.UtcNow.AddDays(-5);

            var payments = new List<Payment>
            {
                CreateTestPayment(),
                CreateTestPayment(),
                CreateTestPayment(),
                CreateTestPayment()
            };
            payments[0].DateCreated = fromDate.AddDays(-1); // Before range
            payments[1].DateCreated = fromDate.AddDays(1);  // In range
            payments[2].DateCreated = fromDate.AddDays(2);  // In range
            payments[3].DateCreated = toDate.AddDays(1);    // After range

            var paymentsQueryable = payments.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(paymentsQueryable);

            var filter = new PaymentFilterDto
            {
                FromDate = fromDate,
                ToDate = toDate,
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _paymentService.GetAllPaymentsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
            Assert.All(result.Items, p =>
            {
                Assert.True(p.DateCreated >= fromDate);
                Assert.True(p.DateCreated <= toDate);
            });
        }

        [Theory]
        [InlineData("Test description")]
        [InlineData("TXN123")]
        [InlineData("HSP12345678")]
        public async Task GetAllPaymentsAsync_FilterBySearchTerm_ReturnsMatchingPayments(string searchTerm)
        {
            // Arrange
            var payments = new List<Payment>
            {
                CreateTestPayment(),
                CreateTestPayment(),
                CreateTestPayment()
            };
            payments[0].Description = "Test description for payment";
            payments[0].TransactionId = "TXN123";
            payments[0].SePayOrderId = "HSP12345678";

            payments[1].Description = "Another payment";
            payments[1].TransactionId = "TXN456";
            payments[1].SePayOrderId = "HSP87654321";

            payments[2].Description = null;
            payments[2].TransactionId = null;
            payments[2].SePayOrderId = null;

            var paymentsQueryable = payments.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(paymentsQueryable);

            var filter = new PaymentFilterDto
            {
                SearchTerm = searchTerm,
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _paymentService.GetAllPaymentsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.TotalCount >= 1);
        }

        [Fact]
        public async Task GetAllPaymentsAsync_SearchTermInDescription_ReturnsMatchingPayments()
        {
            // Arrange
            var payments = new List<Payment>
            {
                CreateTestPayment(),
                CreateTestPayment()
            };
            payments[0].Description = "Payment for booking ABC";
            payments[1].Description = "Different description";

            var paymentsQueryable = payments.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(paymentsQueryable);

            var filter = new PaymentFilterDto
            {
                SearchTerm = "booking",
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _paymentService.GetAllPaymentsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result.Items);
            Assert.Contains("booking", result.Items[0].Description, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task GetAllPaymentsAsync_NoOrderBy_OrdersByDateCreatedDescending()
        {
            // Arrange
            var payments = new List<Payment>
            {
                CreateTestPayment(),
                CreateTestPayment(),
                CreateTestPayment()
            };
            payments[0].DateCreated = DateTime.UtcNow.AddDays(-2);
            payments[1].DateCreated = DateTime.UtcNow.AddDays(-1);
            payments[2].DateCreated = DateTime.UtcNow;

            var paymentsQueryable = payments.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(paymentsQueryable);

            var filter = new PaymentFilterDto
            {
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _paymentService.GetAllPaymentsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(3, result.TotalCount);
            // Verify descending order
            for (int i = 0; i < result.Items.Count - 1; i++)
            {
                Assert.True(result.Items[i].DateCreated >= result.Items[i + 1].DateCreated);
            }
        }

        [Fact]
        public async Task GetAllPaymentsAsync_MultipleFilters_ReturnsMatchingPayments()
        {
            // Arrange
            var targetBookingId = Guid.NewGuid();
            var fromDate = DateTime.UtcNow.AddDays(-10);
            var toDate = DateTime.UtcNow;

            var payments = new List<Payment>
            {
                CreateTestPayment(bookingId: targetBookingId, status: PaymentStatus.Completed),
                CreateTestPayment(bookingId: targetBookingId, status: PaymentStatus.Completed),
                CreateTestPayment(bookingId: targetBookingId, status: PaymentStatus.Pending),
                CreateTestPayment(bookingId: Guid.NewGuid(), status: PaymentStatus.Completed)
            };

            payments[0].DateCreated = fromDate.AddDays(1);
            payments[0].PaymentMethod = PaymentMethod.BankTransfer;

            payments[1].DateCreated = fromDate.AddDays(2);
            payments[1].PaymentMethod = PaymentMethod.BankTransfer;

            payments[2].DateCreated = fromDate.AddDays(1);
            payments[2].PaymentMethod = PaymentMethod.Cash;

            payments[3].DateCreated = fromDate.AddDays(1);
            payments[3].PaymentMethod = PaymentMethod.BankTransfer;

            var paymentsQueryable = payments.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(paymentsQueryable);

            var filter = new PaymentFilterDto
            {
                BookingId = targetBookingId,
                Status = PaymentStatus.Completed,
                PaymentMethod = PaymentMethod.BankTransfer,
                FromDate = fromDate,
                ToDate = toDate,
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _paymentService.GetAllPaymentsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
            Assert.All(result.Items, p =>
            {
                Assert.Equal(targetBookingId, p.BookingId);
                Assert.Equal(PaymentStatus.Completed, p.Status);
                Assert.Equal(PaymentMethod.BankTransfer, p.PaymentMethod);
                Assert.True(p.DateCreated >= fromDate);
                Assert.True(p.DateCreated <= toDate);
            });
        }

        [Fact]
        public async Task GetAllPaymentsAsync_Pagination_ReturnsCorrectPage()
        {
            // Arrange
            var payments = new List<Payment>();
            for (int i = 0; i < 25; i++)
            {
                var payment = CreateTestPayment();
                payment.DateCreated = DateTime.UtcNow.AddMinutes(-i);
                payments.Add(payment);
            }

            var paymentsQueryable = payments.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(paymentsQueryable);

            var filter = new PaymentFilterDto
            {
                PageNumber = 2,
                PageSize = 10
            };

            // Act
            var result = await _paymentService.GetAllPaymentsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(25, result.TotalCount);
            Assert.Equal(10, result.Items.Count);
            Assert.Equal(2, result.CurrentPage);
            Assert.Equal(3, result.TotalPages);
            Assert.True(result.HasPrevious);
            Assert.True(result.HasNext);
        }

        [Fact]
        public async Task GetAllPaymentsAsync_FirstPage_HasNoPrevious()
        {
            // Arrange
            var payments = new List<Payment>();
            for (int i = 0; i < 25; i++)
            {
                payments.Add(CreateTestPayment());
            }

            var paymentsQueryable = payments.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(paymentsQueryable);

            var filter = new PaymentFilterDto
            {
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _paymentService.GetAllPaymentsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.CurrentPage);
            Assert.False(result.HasPrevious);
            Assert.True(result.HasNext);
        }

        [Fact]
        public async Task GetAllPaymentsAsync_LastPage_HasNoNext()
        {
            // Arrange
            var payments = new List<Payment>();
            for (int i = 0; i < 25; i++)
            {
                payments.Add(CreateTestPayment());
            }

            var paymentsQueryable = payments.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(paymentsQueryable);

            var filter = new PaymentFilterDto
            {
                PageNumber = 3, // Last page (25 items / 10 per page = 3 pages)
                PageSize = 10
            };

            // Act
            var result = await _paymentService.GetAllPaymentsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(3, result.CurrentPage);
            Assert.Equal(5, result.Items.Count); // Last page has 5 items
            Assert.True(result.HasPrevious);
            Assert.False(result.HasNext);
        }

        [Fact]
        public async Task GetAllPaymentsAsync_SinglePage_HasNoPreviousOrNext()
        {
            // Arrange
            var payments = new List<Payment>
            {
                CreateTestPayment(),
                CreateTestPayment(),
                CreateTestPayment()
            };

            var paymentsQueryable = payments.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(paymentsQueryable);

            var filter = new PaymentFilterDto
            {
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _paymentService.GetAllPaymentsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.CurrentPage);
            Assert.Equal(1, result.TotalPages);
            Assert.Equal(3, result.Items.Count);
            Assert.False(result.HasPrevious);
            Assert.False(result.HasNext);
        }

        [Fact]
        public async Task GetAllPaymentsAsync_EmptyResult_ReturnsEmptyList()
        {
            // Arrange
            var emptyPayments = new List<Payment>().BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(emptyPayments);

            var filter = new PaymentFilterDto
            {
                BookingId = Guid.NewGuid(),
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _paymentService.GetAllPaymentsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(0, result.TotalCount);
            Assert.Empty(result.Items);
        }

        [Fact]
        public async Task GetAllPaymentsAsync_NullSearchTerm_IgnoresSearchFilter()
        {
            // Arrange
            var payments = new List<Payment>
            {
                CreateTestPayment(),
                CreateTestPayment()
            };

            var paymentsQueryable = payments.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(paymentsQueryable);

            var filter = new PaymentFilterDto
            {
                SearchTerm = null,
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _paymentService.GetAllPaymentsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
        }

        [Fact]
        public async Task GetAllPaymentsAsync_EmptySearchTerm_IgnoresSearchFilter()
        {
            // Arrange
            var payments = new List<Payment>
            {
                CreateTestPayment(),
                CreateTestPayment()
            };

            var paymentsQueryable = payments.BuildMock();
            _paymentRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(paymentsQueryable);

            var filter = new PaymentFilterDto
            {
                SearchTerm = "",
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _paymentService.GetAllPaymentsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
        }

        #endregion

        #region Edge Cases and Integration Tests

        [Fact]
        public async Task CreatePaymentAsync_NullCustomerInfo_CreatesPaymentWithoutCustomerData()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var booking = CreateTestBooking(bookingId);
            booking.Customer = null;

            var bookings = new List<Booking> { booking }.BuildMock();
            var emptyPayments = new List<Payment>().BuildMock();

            _bookingRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings);
            _paymentRepositoryMock.Setup(r => r.GetAll())
                .Returns(emptyPayments);

            var sePayResponse = new SePayCreateOrderResponse
            {
                Success = true,
                OrderId = "HSP12345678",
                PaymentUrl = "https://sepay.com/pay/123"
            };

            _sePayServiceMock.Setup(s => s.CreatePaymentOrderAsync(It.IsAny<SePayCreateOrderRequest>()))
                .ReturnsAsync(sePayResponse);

            var createDto = new CreatePaymentDto
            {
                BookingId = bookingId,
                Amount = 100000,
                PaymentMethod = PaymentMethod.BankTransfer
            };

            // Act
            var result = await _paymentService.CreatePaymentAsync(createDto, "user123");

            // Assert
            Assert.True(result.Success);

            _sePayServiceMock.Verify(s => s.CreatePaymentOrderAsync(It.Is<SePayCreateOrderRequest>(r =>
                r.BuyerName == null &&
                r.BuyerEmail == null &&
                r.BuyerPhone == null
            )), Times.Once);
        }

        [Fact]
        public async Task HandleSePayWebhookAsync_ExceptionThrown_ReturnsFalse()
        {
            // Arrange
            _paymentRepositoryMock.Setup(r => r.GetAll())
                .Throws(new Exception("Database error"));

            var webhook = new SePayWebhookDto
            {
                Content = "HSP12345678",
                TransferAmount = 100000
            };

            // Act
            var result = await _paymentService.HandleSePayWebhookAsync(webhook);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task HandlePaymentCallbackAsync_BookingStatusPending_DoesNotUpdateToCompleted()
        {
            // Arrange
            var paymentId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();

            var payment = CreateTestPayment(paymentId, bookingId, PaymentStatus.Processing);
            var booking = CreateTestBooking(bookingId);
            booking.Status = BookingStatus.Pending;

            _sePayServiceMock.Setup(s => s.VerifyCallbackSignature(It.IsAny<PaymentCallbackDto>()))
                .Returns(true);
            _paymentRepositoryMock.Setup(r => r.GetByIdAsync(paymentId))
                .ReturnsAsync(payment);
            _bookingRepositoryMock.Setup(r => r.GetByIdAsync(bookingId))
                .ReturnsAsync(booking);

            var callback = new PaymentCallbackDto
            {
                OrderId = paymentId.ToString(),
                Status = "success"
            };

            // Act
            var result = await _paymentService.HandlePaymentCallbackAsync(callback);

            // Assert
            Assert.True(result);
            _bookingRepositoryMock.Verify(r => r.Update(It.IsAny<Booking>()), Times.Never);
        }

        [Fact]
        public async Task CreatePaymentAsync_EmptyDescription_GeneratesDefaultDescription()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var booking = CreateTestBooking(bookingId);

            var bookings = new List<Booking> { booking }.BuildMock();
            var emptyPayments = new List<Payment>().BuildMock();

            _bookingRepositoryMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings);
            _paymentRepositoryMock.Setup(r => r.GetAll())
                .Returns(emptyPayments);

            var createDto = new CreatePaymentDto
            {
                BookingId = bookingId,
                Amount = 100000,
                PaymentMethod = PaymentMethod.Cash,
                Description = null
            };

            // Act
            var result = await _paymentService.CreatePaymentAsync(createDto, "user123");

            // Assert
            Assert.True(result.Success);
            Assert.Contains($"Payment for booking {bookingId}", result.Payment?.Description);
        }

        #endregion
    }
}