using HSP.Core.Dtos.BookingDto;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Implementations.Internal;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Xunit;

namespace HSP.Service.Test.Implementations.Internal
{
    public class FeedbackServiceTests
    {
        private readonly Mock<IRepository<Booking, Guid>> _bookingRepoMock;
        private readonly Mock<IRepository<BookingFeedback, Guid>> _feedbackRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IStringLocalizer<SharedResource>> _localizerMock;
        private readonly FeedbackService _service;

        public FeedbackServiceTests()
        {
            _bookingRepoMock = new Mock<IRepository<Booking, Guid>>();
            _feedbackRepoMock = new Mock<IRepository<BookingFeedback, Guid>>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _localizerMock = new Mock<IStringLocalizer<SharedResource>>();

            _service = new FeedbackService(
                _bookingRepoMock.Object,
                _unitOfWorkMock.Object,
                _localizerMock.Object,
                _feedbackRepoMock.Object
            );

            _localizerMock.Setup(x => x[It.IsAny<string>()])
                          .Returns((string key) => new LocalizedString(key, key));
        }

        [Fact]
        public async Task CreateFeedbackAsync_BookingNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            var emptyBookings = new List<Booking>().BuildMock();
            _bookingRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                            .Returns(emptyBookings);

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _service.CreateFeedbackAsync(Guid.NewGuid(), new CreateFeedbackDto(), "user1"));
        }

        [Fact]
        public async Task CreateFeedbackAsync_UserNotOwnerOrTechnician_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var customerId = Guid.NewGuid();
            var technicianUserId = Guid.NewGuid();
            var wrongUserId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = bookingId,
                CustomerId = customerId,
                TechnicianId = Guid.NewGuid(),
                Technician = new TechnicianProfile { UserId = technicianUserId },
                Status = BookingStatus.Completed,
                Payments = new List<Payment> { new Payment { Status = PaymentStatus.Completed } },
                Feedbacks = new List<BookingFeedback>()
            };

            var bookings = new List<Booking> { booking }.BuildMock();
            _bookingRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                            .Returns(bookings);

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _service.CreateFeedbackAsync(bookingId, new CreateFeedbackDto(), wrongUserId.ToString()));
        }

        [Fact]
        public async Task CreateFeedbackAsync_TechnicianNull_ThrowsInvalidOperationException()
        {
            // Arrange
            var id = Guid.NewGuid();
            var booking = new Booking
            {
                Id = id,
                CustomerId = id,
                TechnicianId = null,
                Technician = null,
                Status = BookingStatus.Completed,
                Payments = new List<Payment> { new Payment { Status = PaymentStatus.Completed } },
                Feedbacks = new List<BookingFeedback>()
            };

            var bookings = new List<Booking> { booking }.BuildMock();
            _bookingRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                            .Returns(bookings);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.CreateFeedbackAsync(id, new CreateFeedbackDto(), id.ToString()));
        }

        [Fact]
        public async Task CreateFeedbackAsync_BookingNotCompleted_ThrowsInvalidOperationException()
        {
            // Arrange
            var id = Guid.NewGuid();
            var booking = new Booking
            {
                Id = id,
                CustomerId = id,
                TechnicianId = Guid.NewGuid(),
                Technician = new TechnicianProfile { UserId = Guid.NewGuid() },
                Status = BookingStatus.InProgress,
                Payments = new List<Payment> { new Payment { Status = PaymentStatus.Completed } },
                Feedbacks = new List<BookingFeedback>()
            };

            var bookings = new List<Booking> { booking }.BuildMock();
            _bookingRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                            .Returns(bookings);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.CreateFeedbackAsync(id, new CreateFeedbackDto(), id.ToString()));
        }

        [Fact]
        public async Task CreateFeedbackAsync_BookingNotPaid_ThrowsInvalidOperationException()
        {
            // Arrange
            var id = Guid.NewGuid();
            var booking = new Booking
            {
                Id = id,
                CustomerId = id,
                TechnicianId = Guid.NewGuid(),
                Technician = new TechnicianProfile { UserId = Guid.NewGuid() },
                Status = BookingStatus.Completed,
                Payments = new List<Payment> { new Payment { Status = PaymentStatus.Pending } },
                Feedbacks = new List<BookingFeedback>()
            };

            var bookings = new List<Booking> { booking }.BuildMock();
            _bookingRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                            .Returns(bookings);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.CreateFeedbackAsync(id, new CreateFeedbackDto(), id.ToString()));
        }

        [Fact]
        public async Task CreateFeedbackAsync_CustomerAlreadyHasFeedback_ThrowsInvalidOperationException()
        {
            // Arrange
            var id = Guid.NewGuid();
            var booking = new Booking
            {
                Id = id,
                CustomerId = id,
                TechnicianId = Guid.NewGuid(),
                Technician = new TechnicianProfile { UserId = Guid.NewGuid() },
                Status = BookingStatus.Completed,
                Payments = new List<Payment> { new Payment { Status = PaymentStatus.Completed } },
                Feedbacks = new List<BookingFeedback>
                {
                    new BookingFeedback
                    {
                        BookingId = id,
                        Rating = 5,
                        Source = FeedbackSource.Customer
                    }
                }
            };

            var bookings = new List<Booking> { booking }.BuildMock();
            _bookingRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                            .Returns(bookings);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.CreateFeedbackAsync(id, new CreateFeedbackDto { Rating = 4 }, id.ToString()));
        }

        [Fact]
        public async Task CreateFeedbackAsync_TechnicianAlreadyHasFeedback_ThrowsInvalidOperationException()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var technicianUserId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = bookingId,
                CustomerId = Guid.NewGuid(),
                TechnicianId = Guid.NewGuid(),
                Technician = new TechnicianProfile { UserId = technicianUserId },
                Status = BookingStatus.Completed,
                Payments = new List<Payment> { new Payment { Status = PaymentStatus.Completed } },
                Feedbacks = new List<BookingFeedback>
                {
                    new BookingFeedback
                    {
                        BookingId = bookingId,
                        Rating = 5,
                        Source = FeedbackSource.Technician
                    }
                }
            };

            var bookings = new List<Booking> { booking }.BuildMock();
            _bookingRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                            .Returns(bookings);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.CreateFeedbackAsync(bookingId, new CreateFeedbackDto { Rating = 4 }, technicianUserId.ToString()));
        }

        [Fact]
        public async Task CreateFeedbackAsync_ValidBooking_CustomerFeedback_ReturnsSuccess()
        {
            // Arrange
            var id = Guid.NewGuid();
            var userId = id.ToString();
            var booking = new Booking
            {
                Id = id,
                CustomerId = id,
                TechnicianId = Guid.NewGuid(),
                Technician = new TechnicianProfile { UserId = Guid.NewGuid() },
                Status = BookingStatus.Completed,
                Payments = new List<Payment> { new Payment { Status = PaymentStatus.Completed } },
                Feedbacks = new List<BookingFeedback>()
            };

            var bookings = new List<Booking> { booking }.BuildMock();
            _bookingRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                            .Returns(bookings);

            _feedbackRepoMock.Setup(r => r.AddAsync(It.IsAny<BookingFeedback>()))
                            .ReturnsAsync((BookingFeedback feedback) => feedback);

            _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var input = new CreateFeedbackDto { Rating = 5, Comment = "Excellent service" };

            // Act
            var result = await _service.CreateFeedbackAsync(id, input, userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(id, result.BookingId);
            Assert.Equal(5, result.Rating);
            Assert.Equal("Excellent service", result.Comment);
            Assert.Equal(FeedbackSource.Customer, result.Source);

            _feedbackRepoMock.Verify(r => r.AddAsync(It.Is<BookingFeedback>(f =>
                f.BookingId == id &&
                f.Rating == 5 &&
                f.Comment == "Excellent service" &&
                f.Source == FeedbackSource.Customer
            )), Times.Once);

            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task CreateFeedbackAsync_ValidBooking_TechnicianFeedback_ReturnsSuccess()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var technicianUserId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = bookingId,
                CustomerId = Guid.NewGuid(),
                TechnicianId = Guid.NewGuid(),
                Technician = new TechnicianProfile { UserId = technicianUserId },
                Status = BookingStatus.Completed,
                Payments = new List<Payment> { new Payment { Status = PaymentStatus.Completed } },
                Feedbacks = new List<BookingFeedback>()
            };

            var bookings = new List<Booking> { booking }.BuildMock();
            _bookingRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                            .Returns(bookings);

            _feedbackRepoMock.Setup(r => r.AddAsync(It.IsAny<BookingFeedback>()))
                            .ReturnsAsync((BookingFeedback feedback) => feedback);

            _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var input = new CreateFeedbackDto { Rating = 4, Comment = "Good customer" };

            // Act
            var result = await _service.CreateFeedbackAsync(bookingId, input, technicianUserId.ToString());

            // Assert
            Assert.NotNull(result);
            Assert.Equal(bookingId, result.BookingId);
            Assert.Equal(4, result.Rating);
            Assert.Equal("Good customer", result.Comment);
            Assert.Equal(FeedbackSource.Technician, result.Source);

            _feedbackRepoMock.Verify(r => r.AddAsync(It.Is<BookingFeedback>(f =>
                f.BookingId == bookingId &&
                f.Rating == 4 &&
                f.Comment == "Good customer" &&
                f.Source == FeedbackSource.Technician
            )), Times.Once);

            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task CreateFeedbackAsync_CustomerCanFeedback_WhenTechnicianAlreadyFeedback()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var customerId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = bookingId,
                CustomerId = customerId,
                TechnicianId = Guid.NewGuid(),
                Technician = new TechnicianProfile { UserId = Guid.NewGuid() },
                Status = BookingStatus.Completed,
                Payments = new List<Payment> { new Payment { Status = PaymentStatus.Completed } },
                Feedbacks = new List<BookingFeedback>
                {
                    new BookingFeedback
                    {
                        BookingId = bookingId,
                        Rating = 5,
                        Source = FeedbackSource.Technician
                    }
                }
            };

            var bookings = new List<Booking> { booking }.BuildMock();
            _bookingRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                            .Returns(bookings);

            _feedbackRepoMock.Setup(r => r.AddAsync(It.IsAny<BookingFeedback>()))
                            .ReturnsAsync((BookingFeedback feedback) => feedback);

            _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var input = new CreateFeedbackDto { Rating = 5, Comment = "Great!" };

            // Act
            var result = await _service.CreateFeedbackAsync(bookingId, input, customerId.ToString());

            // Assert
            Assert.NotNull(result);
            Assert.Equal(FeedbackSource.Customer, result.Source);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task CreateFeedbackAsync_SaveChangesFails_ThrowsException()
        {
            // Arrange
            var id = Guid.NewGuid();
            var booking = new Booking
            {
                Id = id,
                CustomerId = id,
                TechnicianId = Guid.NewGuid(),
                Technician = new TechnicianProfile { UserId = Guid.NewGuid() },
                Status = BookingStatus.Completed,
                Payments = new List<Payment> { new Payment { Status = PaymentStatus.Completed } },
                Feedbacks = new List<BookingFeedback>()
            };

            var bookings = new List<Booking> { booking }.BuildMock();
            _bookingRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                            .Returns(bookings);

            _feedbackRepoMock.Setup(r => r.AddAsync(It.IsAny<BookingFeedback>()))
                            .ReturnsAsync((BookingFeedback feedback) => feedback);

            // Simulate DbUpdateException
            var dbUpdateException = new DbUpdateException("Database error", new Exception("Inner exception"));
            _unitOfWorkMock.Setup(u => u.SaveChangesAsync())
                          .ThrowsAsync(dbUpdateException);

            var input = new CreateFeedbackDto { Rating = 5, Comment = "Test" };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<Exception>(() =>
                _service.CreateFeedbackAsync(id, input, id.ToString()));

            Assert.Equal("Đã xảy ra lỗi khi lưu đánh giá. Vui lòng thử lại.", exception.Message);
            Assert.IsType<DbUpdateException>(exception.InnerException);

            _feedbackRepoMock.Verify(r => r.AddAsync(It.IsAny<BookingFeedback>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

    }
}