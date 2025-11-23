using HSP.Core.Abstractions.Entity;
using HSP.Core.Enums;
using HSP.Core.Interfaces.Entity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
    public class Ticket : BaseEntity<Guid>, IDateTracking, IHasSoftedDelete
    {
        public Guid BookingId { get; set; }
        [ForeignKey("BookingId")]
        public Booking Booking { get; set; } = null!;

        public Guid CustomerId { get; set; }
        [ForeignKey("CustomerId")]
        public AppUser Customer { get; set; } = null!;

        public Guid? SupporterId { get; set; }
        [ForeignKey("SupporterId")]
        public AppUser? Supporter { get; set; }

        public Guid? TechnicianId { get; set; }
        [ForeignKey("TechnicianId")]
        public TechnicianProfile? Technician { get; set; }

        [MaxLength(500)]
        public string? IssueDescription { get; set; }

        public TicketStatus Status { get; set; } = TicketStatus.NotAccepted;

        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime DateModified { get; set; }
        public bool IsDeleted { get; set; }
    }
}