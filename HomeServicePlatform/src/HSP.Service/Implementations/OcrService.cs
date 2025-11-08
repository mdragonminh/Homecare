using HSP.Core.Dtos.OcrDto;
using HSP.Core.Interfaces.External;
using HSP.Service.Interfaces;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using System.Text.Json;
using System.Text.RegularExpressions;
using Tesseract;

namespace HSP.Service.Implementations
{
	public class OcrService : IOcrService
	{
		private readonly TesseractEngine _engine;
		private readonly IChatbotService _chatbotService;


		public OcrService(TesseractEngine engine, IChatbotService chatbotService)
		{
			_engine = engine;
			_chatbotService = chatbotService;
		}
		public async Task<CccdDataDto> ScanCccdAsync(byte[] imageData)
		{
			var ocrText = await ExtractTextAsync(imageData);

			var idNumber = ExtractIdNumber(ocrText);
			var dto = await AskGptForCccdDataAsync(ocrText);
			dto.IdNumber = idNumber;
			return dto;
		}

		private async Task<string> ExtractTextAsync(byte[] imageData)
		{
			using var image = Image.Load(imageData);
			image.Mutate(x => x.AutoOrient().Grayscale());

			using var ms = new MemoryStream();
			await image.SaveAsPngAsync(ms);

			using var pix = Pix.LoadFromMemory(ms.ToArray());
			using var page = _engine.Process(pix);

			var rawText = page.GetText() ?? "";
			return Regex.Replace(rawText, @"\s+", " ").Trim();
		}

		private string ExtractIdNumber(string text)
		{
			var match = Regex.Match(text, @"\b\d{12}\b");
			return match.Success ? match.Value : string.Empty;
		}

		private async Task<CccdDataDto> AskGptForCccdDataAsync(string ocrText)
		{
			var prompt = $@"
			Dưới đây là nội dung OCR đọc được từ căn cước công dân Việt Nam (có thể có lỗi chính tả):
			{ocrText}

			Hãy chỉ trích xuất **họ và tên đầy đủ của người được cấp căn cước công dân**.

			Trả về JSON đúng định dạng:
			{{ ""FullName"": ""HOANG QUOC QUAN"" }}";

			var response = await _chatbotService.GetChatResponseAsync(prompt);

			response = response.Replace("```json", "").Replace("```", "").Trim();

			try
			{
				var result = JsonSerializer.Deserialize<CccdDataDto>(response,
					new JsonSerializerOptions
					{
						PropertyNameCaseInsensitive = true
					});

				return result ?? new CccdDataDto();
			}
			catch
			{
				return new CccdDataDto();
			}
		}
	}
}