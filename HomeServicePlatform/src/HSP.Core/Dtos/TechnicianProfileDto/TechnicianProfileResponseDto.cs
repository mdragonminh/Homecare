using HSP.Core.Enums;
using System.ComponentModel.DataAnnotations;
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
        public double Rating { get; set; }
        public int RatingCount { get; set; }
        public string Comment { get; set; } = string.Empty;
        public TechnicianApprovalStatus ApprovalStatus { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? ApprovedAt { get; set; }
        public string? ApprovedBy { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime DateModified { get; set; }
        public List<TechnicianServiceDto> Services { get; set; } = new List<TechnicianServiceDto>();
        public IEnumerable<Core.Dtos.FileDto.FileDto> CertificateFiles { get; set; } = new List<Core.Dtos.FileDto.FileDto>();
        public IEnumerable<Core.Dtos.FileDto.FileDto> LegalDocument { get; set; } = new List<Core.Dtos.FileDto.FileDto>();
        public IEnumerable<Core.Dtos.FileDto.FileDto> Avatar { get; set; } = new List<Core.Dtos.FileDto.FileDto>();

        public string CitizenId { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? RejectionReason { get; set; }
    }

    public class TechnicianServiceDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }
}
