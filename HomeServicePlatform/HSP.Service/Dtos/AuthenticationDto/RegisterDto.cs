using System.ComponentModel.DataAnnotations;

namespace HSP.Service.Dtos.AuthenticationDto
{
	public class RegisterRequestDto
	{
		[Required(ErrorMessage = "Email is required.")]
		[EmailAddress(ErrorMessage = "Invalid email format.")]
		public string Email { get; set; } = string.Empty;
		[Required(ErrorMessage = "Full name is required.")]
		[StringLength(100, ErrorMessage = "Full name must not exceed 100 characters.")]
		public string FullName { get; set; } = string.Empty;
		[Required(ErrorMessage = "Password is required.")]
		[StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be between 8 and 100 characters.")]
		public string Password { get; set; } = string.Empty;
		[Required(ErrorMessage = "Confirm password is required.")]
		[StringLength(100, MinimumLength = 8, ErrorMessage = "Confirm password must be between 8 and 100 characters.")]
		[Compare("Password", ErrorMessage = "Password and confirm password do not match.")]
		public string ConfirmPassword { get; set; } = string.Empty;
	}

	public class RegisterResponseDto
	{
		public Guid UserId { get; set; }
		public string Email { get; set; } = string.Empty;
		public string EmailConfirmToken { get; set; } = string.Empty;
	}
	public class RegisterTechnicianRequestDto : RegisterRequestDto
	{
		[Required(ErrorMessage = "Phone number is required.")]
		[StringLength(10, ErrorMessage = "Phone number must not exceed 10 characters.")]
		public string PhoneNumber { get; set; }
	}
}
