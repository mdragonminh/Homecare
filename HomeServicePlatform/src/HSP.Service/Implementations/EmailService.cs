using HSP.Core.Dtos.ConfigurationDto;
using HSP.Core.Interfaces.External;
using HSP.Service.Dtos.EmailDto;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using System.Net.Mail;

namespace HSP.Service.Implementations
{
	public class EmailService : IEmailService
	{
		private readonly SmtpConfigurationDto _smtpConfig;
		private readonly SmtpClient _smtpClient;
		public EmailService(IOptions<SmtpConfigurationDto> smtpOptions)
		{
			_smtpConfig = smtpOptions.Value;

			_smtpClient = new SmtpClient(_smtpConfig.Host)
			{
				Port = _smtpConfig.Port, 
				Credentials = new System.Net.NetworkCredential(_smtpConfig.UserName, _smtpConfig.Password),
				EnableSsl = _smtpConfig.UseSsl, 
			};
		}

		public async Task SendEmailAsync(EmailDto input)
		{
			if (input == null)
				throw new ArgumentNullException(nameof(input), "Email input cannot be null");

			if (string.IsNullOrWhiteSpace(input.FromEmail))
				input.FromEmail = _smtpConfig.FromEmail;

			if (string.IsNullOrWhiteSpace(input.FromName))
				input.FromName = _smtpConfig.FromName;

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
