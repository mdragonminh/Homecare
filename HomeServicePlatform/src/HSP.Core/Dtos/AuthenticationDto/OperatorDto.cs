using HSP.Core.Resources;
using System.ComponentModel.DataAnnotations;

namespace HSP.Service.Dtos.AuthenticationDto
{
	public class CreateOperatorRequestDto
	{
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "EmailIsRequired")]
		[EmailAddress(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "InvalidEmailFormat")]
		public string Email { get; set; } = string.Empty;

		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "UserNameIsRequired")]
		[StringLength(100, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "UserNameMaxLength")]
		public string Username { get; set; } = string.Empty;

		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordIsRequired")]
		[StringLength(100, MinimumLength = 8, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordLengthError")]
		public string Password { get; set; } = string.Empty;
	}
}
