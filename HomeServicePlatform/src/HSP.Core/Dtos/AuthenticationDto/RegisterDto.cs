using HSP.Core.Resources;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace HSP.Service.Dtos.AuthenticationDto
{
	public class RegisterRequestDto
	{
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "EmailIsRequired")]
		[EmailAddress(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "InvalidEmailFormat")]
		public string Email { get; set; } = string.Empty;
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "FullNameIsRequired")]
		[StringLength(100, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "FullNameMaxLength")]
		public string FullName { get; set; } = string.Empty;
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PhoneNumberIsRequired")]
		[Phone(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "InvalidPhoneNumberFormat")]
		[StringLength(10, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PhoneNumberMaxLength")]
		public string PhoneNumber { get; set; } = string.Empty;
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordIsRequired")]
		[StringLength(100, MinimumLength = 8, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordLengthError")]
		public string Password { get; set; } = string.Empty;
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "ConfirmPasswordIsRequired")]
		[Compare("Password", ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordsDoNotMatch")]
		public string ConfirmPassword { get; set; } = string.Empty;
	}

	public class RegisterResponseDto
	{
		public Guid UserId { get; set; }
        [Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "EmailIsRequired")]
        [EmailAddress(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "InvalidEmailFormat")]
        public string Email { get; set; } = string.Empty;
		public string EmailConfirmToken { get; set; } = string.Empty;
	}
	public class RegisterTechnicianRequestDto : RegisterRequestDto
	{
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "ExperienceYearsIsRequired")]
		[Range(0, 50, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "ExperienceYearsRange")]
		public int ExperienceYears { get; set; }
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "CitizenIdRequired")]
		[MaxLength(12, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "CitizenIdMaxLength")]
		public string CitizenId { get; set; }
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "ServiceIdsIsRequired")]
		public List<Guid> ServiceIds { get; set; } = new List<Guid>();
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "AddressIsRequired")]
		public string Address {  get; set; }
		public IFormFile AvatarFile { get; set; }
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "LegalDocumentIsRequired")]
		public IFormFile LegalDocument { get; set; }
        public List<IFormFile> CertificateFiles { get; set; } = new List<IFormFile>();
	}
}
