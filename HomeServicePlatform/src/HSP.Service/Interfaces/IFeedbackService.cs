using HSP.Core.Dtos.BookingDto;

namespace HSP.Service.Interfaces
{
    public interface IFeedbackService
    {
        Task<BookingFeedbackResponseDto> CreateFeedbackAsync(Guid bookingId, CreateFeedbackDto input, string userId);
    }   
}

