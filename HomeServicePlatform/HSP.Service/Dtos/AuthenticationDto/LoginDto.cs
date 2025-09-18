using System.ComponentModel.DataAnnotations;

namespace HSP.Service.Dtos.AuthenticationDto
{
	public class LoginResponseDto
	{
		public string JwtToken { get; set; } = string.Empty;

		public string UserId { get; set; } = string.Empty;

		public string Email { get; set; } = string.Empty;
	}
	public class LoginRequestDto
	{
		[Required(ErrorMessage = "Email là bắt buộc.")]
		[EmailAddress(ErrorMessage = "Định dạng email không hợp lệ.")]
		public string Email { get; set; } = string.Empty;

		[Required(ErrorMessage = "Mật khẩu là bắt buộc.")]
		[StringLength(100, MinimumLength = 8, ErrorMessage = "Mật khẩu phải có độ dài từ 8 đến 100 ký tự.")]
		public string Password { get; set; } = string.Empty;
	}
}
