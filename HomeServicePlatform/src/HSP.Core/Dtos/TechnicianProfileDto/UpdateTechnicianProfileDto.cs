using HSP.Core.Dtos.AccountDto;
using HSP.Core.Resources;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.TechnicianProfileDto
{
    public class UpdateTechnicianProfileDto
    {
        [Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "CitizenIdRequired")]
        [MaxLength(12, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "CitizenIdMaxLength")]
        public string CitizenId { get; set; } = null!;
        [Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "AddressIsRequired")]
        public string? Address { get; set; }

        [Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "ExperienceYearsIsRequired")]
        [Range(0, 50, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "ExperienceYearsRange")]
        public int ExperienceYears { get; set; }
        public DateTime DateModified { get; set; }
        public List<TechnicianServiceDto>? Services { get; set; }
        public IFormFile? Avatar { get; set; }
        public IFormFile? LegalDocument { get; set; }
        public List<IFormFile>? Certificates { get; set; }
    }
}
