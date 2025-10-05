namespace HSP.API.Models.Emails
{
	public class ConfirmEmailResultViewModel
	{
		public bool Success { get; set; }
		public string Code { get; set; } = string.Empty;   
		public string Title { get; set; } = string.Empty;
		public string Heading { get; set; } = string.Empty;
		public string Message { get; set; } = string.Empty;
		public string PrimaryActionText { get; set; } = string.Empty;
		public string PrimaryActionUrl { get; set; } = string.Empty;
	}
}
