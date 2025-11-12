using HSP.Core.Dtos.ServiceDto;
using HSP.Core.Dtos.TechnicianProfileDto;
using HSP.Core.Dtos.CustomerProfileDto;
using HSP.Core.Enums;

namespace HSP.Core.Dtos.BookingDto
{
    public class BookingDto
    {
        public Guid Id { get; set; }
        public Guid CustomerProfileId { get; set; }
        public Guid? TechnicianId { get; set; }
        public Guid ServiceId { get; set; }
        public DateTime DesiredDate { get; set; }
        public string? ProblemDescription { get; set; }
        public BookingStatus Status { get; set; }
        public DateTime? DateCompleted { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime DateModified { get; set; }

        // Navigation properties
        public HSP.Core.Dtos.CustomerProfileDto.CustomerProfileDto? Customer { get; set; }
        public TechnicianProfileResponseDto? Technician { get; set; }
        public HomeServiceDto? Service { get; set; }
        public BookingFeedbackResponseDto? Feedback { get; set; }
        public BookingCancellationResponseDto? Cancellation { get; set; }
    }

    public class BookingFeedbackResponseDto
    {
        public Guid BookingId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }

    public class BookingCancellationResponseDto
    {
        public Guid BookingId { get; set; }
        public string? Reason { get; set; }
        public Guid? CancelledBy { get; set; }
        public DateTime CancelledAt { get; set; }
    }

    public class BookingDetailDto : BookingDto
    {
        public string? CustomerName { get; set; }
        public string? CustomerEmail { get; set; }
        public string? CustomerPhone { get; set; }
        public string? TechnicianName { get; set; }
        public string? TechnicianEmail { get; set; }
        public string? TechnicianPhone { get; set; }
        public string? ServiceName { get; set; }
        public decimal? ServiceBasePrice { get; set; }
        public List<BookingItemDto>? Items { get; set; }
        public decimal TotalPrice { get; set; }
        public ICollection<PaymentDto.PaymentDto> Payments { get; set; } = new List<PaymentDto.PaymentDto>();
    }

    public class BookingItemDto
    {
        public Guid Id { get; set; }
        public Guid ServiceId { get; set; }
        public string? ServiceName { get; set; }
        public decimal Price { get; set; }
    }

    public class BookingStatsDto
    {
        public int TotalBookings { get; set; }
        public int PendingBookings { get; set; }
        public int ConfirmedBookings { get; set; }
        public int InProgressBookings { get; set; }
        public int CompletedBookings { get; set; }
        public int CancelledBookings { get; set; }
    }
}
