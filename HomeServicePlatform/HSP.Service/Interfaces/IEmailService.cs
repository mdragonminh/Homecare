using HSP.Service.Dtos.EmailDto;

namespace HSP.Service.Interfaces
{
	public interface IEmailService
	{
		Task SendEmailAsync(EmailDto input);
	}
}
