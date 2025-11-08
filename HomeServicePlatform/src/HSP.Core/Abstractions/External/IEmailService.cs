using HSP.Service.Dtos.EmailDto;

namespace HSP.Core.Interfaces.External
{
	public interface IEmailService
	{
		Task SendEmailAsync(EmailDto input);
	}
}
