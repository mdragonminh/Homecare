using HSP.Core.Resources;
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
		[StringLength(20, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PhoneNumberMaxLength")]
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
		public string Email { get; set; } = string.Empty;
		public string EmailConfirmToken { get; set; } = string.Empty;
	}
	public class RegisterTechnicianRequestDto
	{
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "EmailIsRequired")]
		[EmailAddress(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "InvalidEmailFormat")]
		public string Email { get; set; } = string.Empty;

		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "FullNameIsRequired")]
		[StringLength(100, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "FullNameMaxLength")]
		public string FullName { get; set; } = string.Empty;

		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PhoneNumberIsRequired")]
		[Phone(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "InvalidPhoneNumberFormat")]
		[StringLength(20, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PhoneNumberMaxLength")]
		public string PhoneNumber { get; set; } = string.Empty;

		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "SkillSetIsRequired")]
		[StringLength(200, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "SkillSetMaxLength")]
		public string SkillSet { get; set; } = string.Empty;

		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "ExperienceYearsIsRequired")]
		[Range(0, 50, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "ExperienceYearsRange")]
		public int ExperienceYears { get; set; }

		// Danh sách các file paths của chứng chỉ đã upload
		public List<string> CertificateFilePaths { get; set; } = new List<string>();
	}
}
