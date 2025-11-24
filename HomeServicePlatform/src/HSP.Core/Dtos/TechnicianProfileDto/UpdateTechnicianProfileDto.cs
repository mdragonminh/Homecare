using HSP.Core.Dtos.AccountDto;
using HSP.Core.Resources;
using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.TechnicianProfileDto
{
    public class UpdateTechnicianProfileDto
    {
        public Guid UserId { get; set; }
        [Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "EmailIsRequired")]
        public string? Email { get; set; }
        [Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "FullNameIsRequired")]
        [StringLength(100, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "FullNameMaxLength")]
        public string FullName { get; set; } = string.Empty;
        [Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PhoneNumberIsRequired")]
        [Phone(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "InvalidPhoneNumberFormat")]
        [StringLength(10, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PhoneNumberMaxLength")]
        public string PhoneNumber { get; set; } = string.Empty;
        [Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "CitizenIdRequired")]
        [MaxLength(12, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "CitizenIdMaxLength")]
        public string CitizenId { get; set; } = null!;
        [Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "AddressIsRequired")]
        public string? Address { get; set; }

        [Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "ExperienceYearsIsRequired")]
        [Range(0, 50, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "ExperienceYearsRange")]
        public int ExperienceYears { get; set; }
        [Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordIsRequired")]
        [StringLength(100, MinimumLength = 8, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordLengthError")]
        public string Password { get; set; } = string.Empty;
        public DateTime DateModified { get; set; }
        public List<TechnicianServiceDto>? Services { get; set; }

    }
}
