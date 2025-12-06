using HSP.Core.Dtos.CustomerProfileDto;
using HSP.Core.Dtos.ServiceDto;
using HSP.Core.Dtos.TechnicianProfileDto;
using HSP.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.BookingDto
{
    public class BookingDto
    {
        public Guid Id { get; set; }
        public Guid CustomerProfileId { get; set; }
        public Guid? TechnicianId { get; set; }
        public Guid ServiceId { get; set; }
        public DateTime? DesiredDate { get; set; }
        public string? ProblemDescription { get; set; }
        public BookingStatus Status { get; set; }
        public DateTime? DateCompleted { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime DateModified { get; set; }
        public decimal TotalPrice { get; set; }

        // Navigation properties
        public HSP.Core.Dtos.CustomerProfileDto.CustomerProfileDto? Customer { get; set; }
        public TechnicianProfileResponseDto? Technician { get; set; }
        public HomeServiceDto? Service { get; set; }
        public BookingCancellationResponseDto? Cancellation { get; set; }
        public ICollection<BookingFeedbackResponseDto> Feedbacks { get; set; } = new List<BookingFeedbackResponseDto>();
        public List<BookingItemDto>? Items { get; set; }
        public List<BookingEquipmentDto> Equipments { get; set; } = new List<BookingEquipmentDto>();
    }

    public class BookingFeedbackResponseDto
    {
        public Guid BookingId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public FeedbackSource Source { get; set; }
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
        public string? CustomerAddress { get; set; }
        public string? TechnicianName { get; set; }
        public string? TechnicianEmail { get; set; }
        public string? TechnicianPhone { get; set; }
        public string? ServiceName { get; set; }
        public string? Address { get; set; }
        public decimal? ServiceBasePrice { get; set; }
        public double? CustomerAverageRating { get; set; }
        public int? CustomerRatingCount { get; set; }
        public List<BookingItemDto>? Items { get; set; }
        public List<BookingEquipmentDto> Equipments { get; set; } = new List<BookingEquipmentDto>();
        public ICollection<PaymentDto.PaymentDto> Payments { get; set; } = new List<PaymentDto.PaymentDto>();
    }

    public class BookingItemDto
    {
        public Guid Id { get; set; }
        public Guid ServiceId { get; set; }
        public string? ServiceName { get; set; }
        public string? Description { get; set; }
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
    public class AcceptBookingDto
    {
        public Guid BookingId { get; set; }
        public string Token { get; set; } = null!;
    }
    public class AddBookingEquipmentDto
    {
        [Required]
        public Guid EquipmentId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0")]
        public int Quantity { get; set; }
    }

    public class BookingEquipmentDto
    {
        public Guid Id { get; set; } 
        public Guid EquipmentId { get; set; } 
        public string EquipmentName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; } 
        public decimal TotalPrice { get; set; } 
        public BookingEquipmentStatus Status { get; set; }
        public Guid? PaymentId { get; set; }
    }
}
