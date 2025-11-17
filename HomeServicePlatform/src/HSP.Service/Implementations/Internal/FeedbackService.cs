using HSP.Core.Dtos.BookingDto;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace HSP.Service.Implementations.Internal
{
    public class FeedbackService : BaseService, IFeedbackService
    {
        private readonly IRepository<Booking, Guid> _bookingRepository;
        private readonly IRepository<BookingFeedback, Guid> _feedbackRepository;

        public FeedbackService(
            IRepository<Booking, Guid> bookingRepository,
            IRepository<BookingFeedback, Guid> feedbackRepository,
            IUnitOfWork unitOfWork,
            IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
        {
            _bookingRepository = bookingRepository;
            _feedbackRepository = feedbackRepository;
        }

        public async Task<BookingFeedbackResponseDto> CreateFeedbackAsync(Guid bookingId, CreateFeedbackDto input, string userId)
        {
            var booking = await _bookingRepository.GetAll(
                    b => b.Payments,
                    b => b.Feedback
                )
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking == null)
                throw new KeyNotFoundException(_localizer["Không tìm thấy booking."]);

            if (booking.CustomerId.ToString() != userId)
                throw new UnauthorizedAccessException(_localizer["Bạn không có quyền đánh giá booking này."]);

            if (booking.TechnicianId == null)
                throw new InvalidOperationException(_localizer["Booking này chưa được gán cho technician."]);

            if (booking.Status != BookingStatus.Completed)
                throw new InvalidOperationException(_localizer["Dịch vụ chưa hoàn thành, bạn chưa thể đánh giá."]);

            bool isPaid = booking.Payments.Any(p => p.Status == PaymentStatus.Completed);
            if (!isPaid)
                throw new InvalidOperationException(_localizer["Booking chưa được thanh toán."]);

            if (booking.Feedback != null)
                throw new InvalidOperationException(_localizer["Bạn đã đánh giá booking này rồi."]);

            var newFeedback = new BookingFeedback
            {
                Id = Guid.NewGuid(),
                BookingId = bookingId,
                Rating = input.Rating,
                Comment = input.Comment
            };

            await _feedbackRepository.AddAsync(newFeedback);
            await _unitOfWork.SaveChangesAsync(); 

            return new BookingFeedbackResponseDto
            {
                BookingId = newFeedback.BookingId,
                Rating = newFeedback.Rating,
                Comment = newFeedback.Comment
            };
        }
    }
}