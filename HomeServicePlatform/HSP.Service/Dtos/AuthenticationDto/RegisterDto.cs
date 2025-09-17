namespace HSP.Service.Dtos.AuthenticationDto
{
	public class RegisterRequestDto
	{
		public string Email { get; set; } = string.Empty;
		public string FullName { get; set; } = string.Empty;
		public string Password { get; set; } = string.Empty;
	}

	public class RegisterResponseDto
	{
		public Guid UserId { get; set; }
		public string Email { get; set; } = string.Empty;
		public string EmailConfirmToken { get; set; } = string.Empty;
	}
}
