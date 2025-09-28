using HSP.Core.Interfaces.External;
using HSP.Service.Dtos.EmailDto;
using Microsoft.Extensions.Configuration;
using System.Net.Mail;

namespace HSP.Service.Implementations
{
	public class EmailService : IEmailService
	{
		private readonly IConfiguration _config;
		private readonly SmtpClient _smtpClient;
		public EmailService(IConfiguration config)
		{
			_config = config;
			_smtpClient = new SmtpClient(_config["Smtp:Host"])
			{
				Port = int.Parse(_config["Smtp:Port"] ?? "587"),
				Credentials = new System.Net.NetworkCredential(_config["Smtp:UserName"], _config["Smtp:Password"]),
				EnableSsl = bool.Parse(_config["Smtp:EnableSsl"] ?? "true"),
			};
		}

		public async Task SendEmailAsync(EmailDto input)
		{
			if (input == null)
				throw new ArgumentNullException(nameof(input), "Email input cannot be null");

			if (string.IsNullOrWhiteSpace(input.FromEmail))
				input.FromEmail = _config["Smtp:FromEmail"];

			if (string.IsNullOrWhiteSpace(input.FromName))
				input.FromName = _config["Smtp:FromName"];

			var mailMessage = new MailMessage
			{
				From = new MailAddress(input.FromEmail,input.FromName),
				Subject = input.Subject,
				Body = input.HtmlBody,
				IsBodyHtml = true
			};
			mailMessage.To.Add(input.ToEmail);
			try
			{
				await _smtpClient.SendMailAsync(mailMessage);
			}
			catch (Exception ex)
			{
				throw new InvalidOperationException("Email sending failed", ex);
			}
		}
	}
}
