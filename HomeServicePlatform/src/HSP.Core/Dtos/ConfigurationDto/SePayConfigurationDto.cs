namespace HSP.Core.Dtos.ConfigurationDto
{
	public class SePayConfigurationDto
	{
		public string AccountId { get; set; } = string.Empty;
		public string ApiKey { get; set; } = string.Empty;
		public string SecretKey { get; set; } = string.Empty;
		public string ApiBaseUrl { get; set; } = string.Empty;
		public string CallbackUrl { get; set; } = string.Empty;
		public string ReturnUrl { get; set; } = string.Empty;
		public int TimeoutSeconds { get; set; } = 30;
		
		// Bank account information for payment instructions
		public string BankName { get; set; } = string.Empty;
		public string BankAccountNumber { get; set; } = string.Empty;
		public string BankAccountName { get; set; } = string.Empty;
		public string BankBranch { get; set; } = string.Empty;
	}
}
