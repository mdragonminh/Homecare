namespace HSP.Service.DTOs.Ticket
{
    using HSP.Core.Enums;

    public class TicketDto
    {
        public Guid Id { get; set; } 
        public Guid EquipmentId { get; set; }
        public Guid SupporterId { get; set; }
        public Guid? TechnicianId { get; set; }
        public string? IssueDescription { get; set; }
        public string Status { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime DateCreated { get; set; }
        public string TechnicianName { get; set; }
        public string EquipmentName { get; set; }
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
}