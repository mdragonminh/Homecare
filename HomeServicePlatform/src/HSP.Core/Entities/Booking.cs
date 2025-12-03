using HSP.Core.Interfaces.Entity;
using HSP.Core.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using HSP.Core.Abstractions.Entity;

namespace HSP.Core.Entities
{
    public class Booking : BaseEntity<Guid>, IDateTracking, IHasSoftedDelete
    {
        public Guid CustomerId { get; set; }
        [ForeignKey("CustomerId")]
        public AppUser Customer { get; set; } = null!;
        public Guid? TechnicianId { get; set; }
        [ForeignKey("TechnicianId")]
        public TechnicianProfile? Technician { get; set; }
        public DateTime? DesiredDate { get; set; }
        [MaxLength(1000)]
        public string? ProblemDescription { get; set; }
        public BookingStatus Status { get; set; } = BookingStatus.Pending;
        public DateTime? DateCompleted { get; set; }
        [Required]
        [Range(-90, 90)]
        public double Latitude { get; set; }
        [Required]
        [Range(-180, 180)]
        public double Longitude { get; set; }
        public BookingCancellation? Cancellation { get; set; }
        [NotMapped]
        public ICollection<FileRelation> Files { get; set; } = new List<FileRelation>();
        public bool IsDeleted { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime DateModified { get; set; }
        public ICollection<BookingFeedback> Feedbacks { get; set; } = new List<BookingFeedback>();
        public ICollection<BookingItem> Items { get; set; } = new List<BookingItem>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}
