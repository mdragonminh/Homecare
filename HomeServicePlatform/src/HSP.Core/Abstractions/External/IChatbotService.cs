using HSP.Core.Dtos.ChatbotDto;

namespace HSP.Core.Interfaces.External
{
	public interface IChatbotService
	{
		Task<ChatResponseDto> ProcessMessageAsync(ChatInputDto input, Guid customerId);
		Task<bool> ValidateCertificateAsync(string ocrText, List<string> serviceNames);
		Task<bool> ValidateLegalDocumentAsync(string ocrText, string citizenId);
    }
}
