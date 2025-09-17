namespace HSP.Service.Dtos.EmailDto
{
	public class EmailDto
	{
		public string FromEmail { get; set; } = string.Empty;
		public string FromName { get; set; } = string.Empty;
		public string ToEmail { get; set; } = string.Empty;
		public string Subject { get; set; } = string.Empty;
		public string HtmlBody { get; set; } = string.Empty;
		public string? TextBody { get; set; }
	}
}
