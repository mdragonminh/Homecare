using HSP.Core.Resources;
using System.ComponentModel.DataAnnotations;

namespace HSP.Service.Dtos.AuthenticationDto
{
	public class LoginResponseDto
	{
		public string JwtToken { get; set; } = string.Empty;
		public bool RequirePasswordSetup { get; set; }
	}
	public class LoginRequestDto
	{
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "EmailOrPhoneIsRequired")]
		public string EmailOrPhone { get; set; } = string.Empty;

		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordIsRequired")]
		[StringLength(100, MinimumLength = 8, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordLengthError")]
		public string Password { get; set; } = string.Empty;
	}
	public class AddPasswordDto
	{
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordIsRequired")]
		[StringLength(100, MinimumLength = 8, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordLengthError")]
		public string NewPassword { get; set; }

		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "ConfirmPasswordIsRequired")]
		[Compare("NewPassword", ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordsDoNotMatch")]
		public string ConfirmPassword { get; set; }
	}
}
