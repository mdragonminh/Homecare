using HSP.Core.Dtos.Shared;
using HSP.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.BookingDto
{
    public class BookingInput : PaginationParams
    {
        public string? SearchTerm { get; set; }
        public BookingStatus? Status { get; set; }
        public Guid? TechnicianId { get; set; }
        public Guid? CustomerId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }

    public class CreateBookingDto
    {
        [Required]
        public Guid ServiceId { get; set; }

        [Required]
        public DateTime DesiredDate { get; set; }

        [MaxLength(1000)]
        public string? ProblemDescription { get; set; }
    }

    public class UpdateBookingDto
    {
        [Required]
        public Guid Id { get; set; }

        public DateTime? DesiredDate { get; set; }

        [MaxLength(1000)]
        public string? ProblemDescription { get; set; }

        public BookingStatus? Status { get; set; }
    }

    public class AssignTechnicianDto
    {
        [Required]
        public Guid BookingId { get; set; }

        [Required]
        public Guid TechnicianId { get; set; }
    }

    public class UpdateBookingStatusDto
    {
        [Required]
        public Guid BookingId { get; set; }

        [Required]
        public BookingStatus Status { get; set; }

        public string? Notes { get; set; }
    }

    public class CancelBookingDto
    {
        [Required]
        public Guid BookingId { get; set; }

        [MaxLength(500)]
        public string? Reason { get; set; }
    }

    public class BookingFeedbackDto
    {
        [Required]
        public Guid BookingId { get; set; }

        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }
    }

    public class RejectBookingDto
    {
        [Required]
        public string Reason { get; set; } = string.Empty;
    }
}
