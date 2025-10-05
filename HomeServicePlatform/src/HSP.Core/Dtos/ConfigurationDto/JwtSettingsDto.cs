namespace HSP.Core.Dtos.ConfigurationDto
{
	public class JwtSettingsDto
	{
		public string SecretKey { get; set; }
		public string Issuer { get; set; }
		public string Audience { get; set; }
		public int ExpirationInMinutes { get; set; }
		public int RefreshTokenExpirationInDays { get; set; }
	}
}
