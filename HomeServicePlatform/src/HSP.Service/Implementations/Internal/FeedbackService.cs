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
            IUnitOfWork unitOfWork,
            IStringLocalizer<SharedResource> localizer,
            IRepository<BookingFeedback, Guid> feedbackRepository) : base(unitOfWork, localizer)
        {
            _bookingRepository = bookingRepository;
            _feedbackRepository = feedbackRepository;
        }

        public async Task<BookingFeedbackResponseDto> CreateFeedbackAsync(Guid bookingId, CreateFeedbackDto input, string userId)
        {
            var booking = await _bookingRepository.GetAll(
                    b => b.Payments,
                    b => b.Feedbacks,
                    b => b.Technician
                )
                .FirstOrDefaultAsync(b => b.Id == bookingId);


            if (booking == null)
                throw new KeyNotFoundException(_localizer["Không tìm thấy booking."]);

            bool isCustomer = booking.CustomerId.ToString() == userId;
            bool isTechnician = booking.Technician != null && booking.Technician.UserId.ToString() == userId;

            if (!isCustomer && !isTechnician)
                throw new UnauthorizedAccessException(_localizer["Bạn không có quyền đánh giá booking này."]);

            if (booking.TechnicianId == null)
                throw new InvalidOperationException(_localizer["Booking này chưa được gán cho technician."]);

            if (booking.Status != BookingStatus.Completed)
                throw new InvalidOperationException(_localizer["Dịch vụ chưa hoàn thành, bạn chưa thể đánh giá."]);

            bool isPaid = booking.Payments.Any(p => p.Status == PaymentStatus.Completed);
            if (!isPaid)
                throw new InvalidOperationException(_localizer["Booking chưa được thanh toán."]);

            var source = isCustomer ? FeedbackSource.Customer : FeedbackSource.Technician;

            if (booking.Feedbacks.Any(f => f.Source == source))
            {
                throw new InvalidOperationException(_localizer["Bạn đã đánh giá booking này rồi."]);
            }

            var newFeedback = new BookingFeedback
            {
                BookingId = bookingId,
                Rating = input.Rating,
                Comment = input.Comment,
                Source = source 
            };

            await _feedbackRepository.AddAsync(newFeedback);
            try
            {
                await _unitOfWork.SaveChangesAsync();

            }
            catch (DbUpdateException ex)
            {
                throw new Exception(_localizer["Đã xảy ra lỗi khi lưu đánh giá. Vui lòng thử lại."], ex);
            }

            return new BookingFeedbackResponseDto
            {
                BookingId = newFeedback.BookingId,
                Rating = newFeedback.Rating,
                Comment = newFeedback.Comment,
                Source = newFeedback.Source
            };
        }
    }
}