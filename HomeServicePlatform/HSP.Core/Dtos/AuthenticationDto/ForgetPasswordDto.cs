using HSP.Core.Resources;
using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.AuthenticationDto
{
	public class ForgetPasswordDto
	{
		[Required]
		[EmailAddress]
		public string Email { get; set; } = string.Empty;
	}
	public class ResetPasswordDto
	{
		[Required]
		public string UserId { get; set; }

		[Required]
		public string Token { get; set; }

		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordIsRequired")]
		[StringLength(100, MinimumLength = 8, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordLengthError")]
		public string NewPassword { get; set; }

		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "ConfirmPasswordIsRequired")]
		[Compare("NewPassword", ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordsDoNotMatch")]
		public string ConfirmPassword { get; set; }
	}
}
