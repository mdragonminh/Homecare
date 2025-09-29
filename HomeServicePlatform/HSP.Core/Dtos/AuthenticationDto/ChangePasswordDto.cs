using HSP.Core.Resources;
using System.ComponentModel.DataAnnotations;

namespace HSP.Service.Dtos.AuthenticationDto
{
	public class ChangePasswordRequestDto
	{
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordIsRequired")]
		public string CurrentPassword { get; set; } = string.Empty;

		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordIsRequired")]
		[StringLength(100, MinimumLength = 8, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordLengthError")]
		public string NewPassword { get; set; } = string.Empty;

		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordIsRequired")]
		[Compare("NewPassword", ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordsDoNotMatch")]
		public string ConfirmNewPassword { get; set; } = string.Empty;
	}

	public class ChangePasswordResponseDto
	{
		public string Message { get; set; } = string.Empty;
	}
}
