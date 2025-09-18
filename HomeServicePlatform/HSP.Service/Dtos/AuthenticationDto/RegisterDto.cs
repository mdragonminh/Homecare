using System.ComponentModel.DataAnnotations;

namespace HSP.Service.Dtos.AuthenticationDto
{
	public class RegisterRequestDto
	{
		[Required(ErrorMessage = "Email là bắt buộc.")]
		[EmailAddress(ErrorMessage = "Định dạng email không hợp lệ.")]
		public string Email { get; set; } = string.Empty;
		[Required(ErrorMessage = "Họ và tên là bắt buộc.")]
		[StringLength(100, ErrorMessage = "Họ và tên không được dài hơn 100 ký tự.")]
		public string FullName { get; set; } = string.Empty;
		[Required(ErrorMessage = "Mật khẩu là bắt buộc.")]
		[StringLength(100, MinimumLength = 8, ErrorMessage = "Mật khẩu phải có độ dài từ 8 đến 100 ký tự.")]
		public string Password { get; set; } = string.Empty;
		[Required(ErrorMessage = "Xác nhận mật khẩu là bắt buộc.")]
		[StringLength(100, MinimumLength = 8, ErrorMessage = "Xác nhận mật khẩu phải có độ dài từ 8 đến 100 ký tự.")]
		[Compare("Password", ErrorMessage = "Mật khẩu và xác nhận mật khẩu không khớp.")]
		public string ConfirmPassword { get; set; } = string.Empty;
	}

	public class RegisterResponseDto
	{
		public Guid UserId { get; set; }
		public string Email { get; set; } = string.Empty;
		public string EmailConfirmToken { get; set; } = string.Empty;
	}
}
