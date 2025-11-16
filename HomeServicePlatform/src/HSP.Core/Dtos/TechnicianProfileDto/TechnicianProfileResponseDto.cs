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
        public int ExperienceYears { get; set; }
        public TechnicianApprovalStatus ApprovalStatus { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? ApprovedAt { get; set; }
        public string? ApprovedBy { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime DateModified { get; set; }
        public List<TechnicianServiceDto> Services { get; set; } = new List<TechnicianServiceDto>();
        public List<TechnicianFileDto> CertificateFiles { get; set; } = new List<TechnicianFileDto>();
    }

    public class TechnicianServiceDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class TechnicianFileDto
    {
        public Guid Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty; 
        public string FileType { get; set; } = string.Empty;
    }
}
