using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.TechnicianProfileDto
{
    public class TechnicianRejectDto
    {
        [Required]
        [StringLength(500)]
        public string RejectionReason { get; set; } = string.Empty;
    }
}
