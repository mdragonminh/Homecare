using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.AuthenticationDto
{
	public class TokenResponseDto
	{
		public string AccessToken { get; set; } = string.Empty;
		public string RefreshToken { get; set; } = string.Empty;
		public DateTime AccessTokenExpiresAt { get; set; }
		public DateTime RefreshTokenExpiresAt { get; set; }
	}
	public class RefreshTokenRequestDto
	{
		[Required]
		public string RefreshToken { get; set; } = string.Empty;
	}
}
