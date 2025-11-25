using HSP.Core.Dtos.BookingDto;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Implementations.Internal;
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
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IStringLocalizer<SharedResource>> _localizerMock;
        private readonly FeedbackService _service;

        public FeedbackServiceTests()
        {
            _bookingRepoMock = new Mock<IRepository<Booking, Guid>>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _localizerMock = new Mock<IStringLocalizer<SharedResource>>();

            _service = new FeedbackService(
                _bookingRepoMock.Object,
                _unitOfWorkMock.Object,
                _localizerMock.Object
            );

            _localizerMock.Setup(x => x[It.IsAny<string>()])
                          .Returns((string key) => new LocalizedString(key, key));
        }

        [Fact]
        public async Task CreateFeedbackAsync_BookingNotFound_ThrowsKeyNotFoundException()
        {
            var emptyBookings = new List<Booking>().BuildMock();
            _bookingRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                            .Returns(emptyBookings);

            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _service.CreateFeedbackAsync(Guid.NewGuid(), new CreateFeedbackDto(), "user1"));
        }

        [Fact]
        public async Task CreateFeedbackAsync_UserNotOwner_ThrowsUnauthorizedAccessException()
        {
            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                CustomerId = Guid.NewGuid(),
                TechnicianId = Guid.NewGuid(),
                Status = BookingStatus.Completed,
                Payments = new List<Payment> { new Payment { Status = PaymentStatus.Completed } }
            };

            var bookings = new List<Booking> { booking }.BuildMock();
            _bookingRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                            .Returns(bookings);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _service.CreateFeedbackAsync(booking.Id, new CreateFeedbackDto(), "wrong-user"));
        }

        [Fact]
        public async Task CreateFeedbackAsync_TechnicianNull_ThrowsInvalidOperationException()
        {
            var id = Guid.NewGuid();
            var booking = new Booking
            {
                Id = id,
                CustomerId = id,
                TechnicianId = null,
                Status = BookingStatus.Completed,
                Payments = new List<Payment> { new Payment { Status = PaymentStatus.Completed } }
            };

            var bookings = new List<Booking> { booking }.BuildMock();
            _bookingRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                            .Returns(bookings);

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.CreateFeedbackAsync(id, new CreateFeedbackDto(), id.ToString()));
        }

        [Fact]
        public async Task CreateFeedbackAsync_BookingNotCompleted_ThrowsInvalidOperationException()
        {
            var id = Guid.NewGuid();
            var booking = new Booking
            {
                Id = id,
                CustomerId = id,
                TechnicianId = Guid.NewGuid(),
                Status = BookingStatus.InProgress,
                Payments = new List<Payment> { new Payment { Status = PaymentStatus.Completed } }
            };

            var bookings = new List<Booking> { booking }.BuildMock();
            _bookingRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                            .Returns(bookings);

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.CreateFeedbackAsync(id, new CreateFeedbackDto(), id.ToString()));
        }

        [Fact]
        public async Task CreateFeedbackAsync_BookingNotPaid_ThrowsInvalidOperationException()
        {
            var id = Guid.NewGuid();
            var booking = new Booking
            {
                Id = id,
                CustomerId = id,
                TechnicianId = Guid.NewGuid(),
                Status = BookingStatus.Completed,
                Payments = new List<Payment> { new Payment { Status = PaymentStatus.Pending } }
            };

            var bookings = new List<Booking> { booking }.BuildMock();
            _bookingRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                            .Returns(bookings);

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.CreateFeedbackAsync(id, new CreateFeedbackDto(), id.ToString()));
        }

        [Fact]
        public async Task CreateFeedbackAsync_AlreadyHasFeedback_ThrowsInvalidOperationException()
        {
            var id = Guid.NewGuid();
            var booking = new Booking
            {
                Id = id,
                CustomerId = id,
                TechnicianId = Guid.NewGuid(),
                Status = BookingStatus.Completed,
                Payments = new List<Payment> { new Payment { Status = PaymentStatus.Completed } },
                Feedback = new BookingFeedback { Rating = 5 }
            };

            var bookings = new List<Booking> { booking }.BuildMock();
            _bookingRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                            .Returns(bookings);

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.CreateFeedbackAsync(id, new CreateFeedbackDto(), id.ToString()));
        }

        [Fact]
        public async Task CreateFeedbackAsync_ValidBooking_ReturnsFeedback()
        {
            var id = Guid.NewGuid();
            var userId = id.ToString();
            var booking = new Booking
            {
                Id = id,
                CustomerId = id,
                TechnicianId = Guid.NewGuid(),
                Status = BookingStatus.Completed,
                Payments = new List<Payment> { new Payment { Status = PaymentStatus.Completed } },
                Feedback = null
            };

            var bookings = new List<Booking> { booking }.BuildMock();
            _bookingRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                            .Returns(bookings);

            _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var input = new CreateFeedbackDto { Rating = 5, Comment = "Excellent service" };

            var result = await _service.CreateFeedbackAsync(id, input, userId);

            Assert.NotNull(result);
            Assert.Equal(id, result.BookingId);
            Assert.Equal(5, result.Rating);
            Assert.Equal("Excellent service", result.Comment);
            Assert.NotNull(booking.Feedback);

            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }
    }
}
