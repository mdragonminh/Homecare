using HSP.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.TechnicianProfileDto
{
    public class TechnicianApprovalDto
    {
        [Required]
        public Guid TechnicianProfileId { get; set; }
        
        [Required]
        public TechnicianApprovalStatus ApprovalStatus { get; set; }
        
        public string? Remarks { get; set; }
    }
}
