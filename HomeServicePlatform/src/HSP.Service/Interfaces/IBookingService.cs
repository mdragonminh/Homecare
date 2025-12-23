using HSP.Core.Dtos.BookingDto;
using HSP.Core.Dtos.EquipmentDto;
using HSP.Core.Dtos.Shared;

namespace HSP.Service.Interfaces
{
	public interface IBookingService
	{
		// Technician Operations
		Task<PagedList<BookingDto>> GetAllBookingsAsync(BookingInput input);
		Task<BookingDetailDto?> GetBookingDetailAsync(Guid bookingId, Guid userId);
		Task<bool> UpdateBookingStatusAsync(UpdateBookingStatusDto input, string technicianUserId);
		Task<bool> CancelBookingAsync(CancelBookingDto input, string userId);
		Task<bool> TechnicianRejectAsync(Guid bookingId, Guid technicianUserId);
        Task<BookingAcceptResultDto> AcceptBookingAsync(Guid userId, AcceptBookingDto input);
        Task<bool> AddEquipmentToBookingAsync(Guid bookingId, AddBookingEquipmentDto input, Guid userId);
		Task<bool> SubmitEquipmentToCustomerAsync(SubmitEquipmentDto input, Guid userId);
		Task<bool> ApproveEquipmentAsync(ApproveEquipmentDto input, Guid managerId);
        Task<bool> RemoveEquipmentFromBookingAsync(Guid bookingId, Guid bookingEquipmentId, Guid userId);
        Task<bool> TryCompleteBookingAsync(Guid bookingId);
    }
}
