using HSP.Core.Enums;

namespace HSP.Core.Dtos.TechnicianProfileDto
{
    public class TechnicianProfileResponseDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string SkillSet { get; set; } = string.Empty;
        public int ExperienceYears { get; set; }
        public TechnicianApprovalStatus ApprovalStatus { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string? ApprovedBy { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime DateModified { get; set; }
    }
}
