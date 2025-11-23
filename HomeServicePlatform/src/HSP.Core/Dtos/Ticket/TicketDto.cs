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
        public string Status { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? TechnicianName { get; set; }
        public string? CustomerName { get; set; } 
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
    }
}