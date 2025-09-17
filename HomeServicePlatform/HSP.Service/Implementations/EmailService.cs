using HSP.Service.Dtos.EmailDto;
using HSP.Service.Interfaces;
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
			_smtpClient = new SmtpClient(config["Smtp:Host"])
			{
				Port = int.Parse(config["Smtp:Port"] ?? "587"),
				Credentials = new System.Net.NetworkCredential(config["Smtp:UserName"], config["Smtp:Password"]),
				EnableSsl = bool.Parse(config["Smtp:EnableSsl"] ?? "true"),
			};
		}

		public async Task SendEmailAsync(EmailDto input)
		{
			var mailMessage = new MailMessage
			{
				From = new MailAddress(input.FromEmail ?? _config["Smtp:FromEmail"], input.FromName ?? _config["Smtp:FromName"]),
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
