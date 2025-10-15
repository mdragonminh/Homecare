using HSP.Core.Dtos.BookingDto;
using HSP.Core.Dtos.Shared;

namespace HSP.Service.Interfaces
{
    public interface IBookingService
    {
        // Technician Operations
        Task<PagedList<BookingDto>> GetAllBookingsAsync(BookingInput input);
        Task<BookingDetailDto?> GetBookingDetailAsync(Guid bookingId);
        Task<bool> UpdateBookingStatusAsync(UpdateBookingStatusDto input, string technicianUserId);
        Task<bool> CancelBookingAsync(CancelBookingDto input, string userId);
    }
}
