using HSP.Core.Dtos.ConfigurationDto;
using HSP.Core.Interfaces.External;
using HSP.Service.Dtos.EmailDto;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;

namespace HSP.Service.Implementations
{
	public class EmailService : IEmailService
	{
		private readonly SmtpConfigurationDto _smtpConfig;
		public EmailService(IOptions<SmtpConfigurationDto> smtpOptions)
		{
			_smtpConfig = smtpOptions.Value;
		}

		public async Task SendEmailAsync(EmailDto input)
		{
			if (input == null)
				throw new ArgumentNullException(nameof(input));

			var mailMessage = new MailMessage
			{
				From = new MailAddress(
							input.FromEmail ?? _smtpConfig.FromEmail,
							input.FromName ?? _smtpConfig.FromName),
				Subject = input.Subject,
				Body = input.HtmlBody,
				IsBodyHtml = true
			};

			mailMessage.To.Add(input.ToEmail);

			if (!string.IsNullOrEmpty(input.FromEmail))
				mailMessage.ReplyToList.Add(new MailAddress(input.FromEmail));

			using (var client = new SmtpClient(_smtpConfig.Host, _smtpConfig.Port))
			{
				client.Credentials = new NetworkCredential(_smtpConfig.UserName, _smtpConfig.Password);
				client.EnableSsl = _smtpConfig.UseSsl;
				client.Timeout = 10000;

				try
				{
					await client.SendMailAsync(mailMessage);
				}
				catch (Exception ex)
				{
					Console.WriteLine($"Failed to send email to {input.ToEmail}: {ex.Message}");
					throw;
				}
			}
		}
	}
}
