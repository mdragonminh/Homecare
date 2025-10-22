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
	public class ConfirmEmailDto
	{
		public string FullName { get; set; } = string.Empty;
		public string ConfirmUrl { get; set; } = string.Empty;
	}
	public class ConfirmEmailResultDto
	{
		public bool Success { get; set; }
		public string? Error { get; set; } 
		public string? Message { get; set; }

		public string Title { get; set; } = "";
		public string Heading { get; set; } = "";
		public string ActionUrl { get; set; } = "";
	}
	public class ResetPasswordDto
	{
		public string FullName { get; set; } = string.Empty;
		public string ResetUrl { get; set; } = string.Empty;
	}
	public class TechnicianInvitationDto
	{
		public string TechnicianName { get; set; } = string.Empty;
		public string CustomerName { get; set; } = string.Empty;
		public string ServiceName { get; set; } = string.Empty;
		public double DistanceKm { get; set; }
		public DateTime DesiredDate { get; set; }
		public string AcceptUrl { get; set; } = string.Empty;
		public string DeclineUrl { get; set; } = string.Empty;
	}
}
