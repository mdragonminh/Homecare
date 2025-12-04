namespace HSP.Service.DTOs.Ticket
{
    using HSP.Core.Enums;
    using System.ComponentModel.DataAnnotations;

    public class TicketDto
    {
        public Guid Id { get; set; }
        public Guid BookingId { get; set; } 
        public Guid CustomerId { get; set; } 
        public Guid? SupporterId { get; set; }
        public Guid? TechnicianId { get; set; }
        public string? IssueDescription { get; set; }
        public bool IsRefundRequested { get; set; }
        public string Status { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? TechnicianName { get; set; }
        public string? CustomerName { get; set; }
        public BookingDetailDto? BookingDetail { get; set; }
        public PaymentDetailDto? PaymentDetail { get; set; }
    }

    public class BookingDetailDto
    {
        public Guid Id { get; set; }
        public DateTime? DesiredDate { get; set; }
        public string? ProblemDescription { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime DateCreated { get; set; }
        public DateTime DateModified { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public CustomerInfoDto? Customer { get; set; }
        public TechnicianInfoDto? Technician { get; set; }
        public List<ServiceItemDto> Services { get; set; } = new();
        public List<EquipmentItemDto> Equipments { get; set; } = new();
    }

    public class PaymentDetailDto
    {
        public Guid Id { get; set; }
        public decimal Amount { get; set; }
        public int PaymentMethod { get; set; }
        public int Status { get; set; }
        public string? TransactionId { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime DateCreated { get; set; }
        public string? Description { get; set; }
    }

    public class CustomerInfoDto
    {
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
    }

    public class TechnicianInfoDto
    {
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
    }

    public class ServiceItemDto
    {
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }

    public class EquipmentItemDto
    {
        public string Name { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Total => Quantity * UnitPrice;
    }

    public class AssignTechnicianDto
    {
        public Guid TicketId { get; set; } 
        public string TechnicianId { get; set; } 
    }

    public class UpdateTicketStatusDto
    {
        public Guid TicketId { get; set; } 
        public TicketStatus NewStatus { get; set; }     
    }

    public class CreateTicketDto
    {
        [Required]
        public Guid BookingId { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập mô tả vấn đề")]
        [MaxLength(500)]
        public string IssueDescription { get; set; } = null!;

        public bool IsRefundRequested { get; set; } = false;
    }
}