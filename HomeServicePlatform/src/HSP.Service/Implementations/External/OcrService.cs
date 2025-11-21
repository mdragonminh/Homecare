using HSP.Core.Constants;
using HSP.Core.Dtos.OcrDto;
using HSP.Core.Interfaces.External;
using HSP.Service.Interfaces;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;
using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Tesseract;

namespace HSP.Service.Implementations.External
{
	public class OcrService : IOcrService
	{
        private readonly IChatbotService _chatbotService;
        public OcrService(IChatbotService chatbotService)
		{
            _chatbotService = chatbotService;
        }
        public async Task<CccdDataDto> ScanCccdAsync(byte[] imageData)
        {
            using var image = Image.Load<Rgba32>(imageData);
            var preprocessed = Preprocess(image.Clone());
            string rawText = await OcrFull(preprocessed);

            string idNumber = ExtractIdNumber(rawText);

            string fullName = ExtractFullName(rawText);

            return new CccdDataDto
            {
                IdNumber = idNumber,
                FullName = fullName
            };
        }
        public async Task<string> ExtractTextAsync(byte[] imageData)
        {
            using var image = Image.Load<Rgba32>(imageData);
            var preprocessed = Preprocess(image.Clone());
            var text = await OcrFull(preprocessed);
            return text;
        }
        private Image<Rgba32> Preprocess(Image<Rgba32> img)
        {
            img.Mutate(x =>
            {
                x.AutoOrient();
                x.Resize(img.Width * 2, img.Height * 2);
                x.Grayscale();
                x.GaussianSharpen(0.6f);
                x.Contrast(1.1f);
            });

            return img;
        }
        private async Task<string> OcrFull(Image<Rgba32> img)
        {
            using var ms = new MemoryStream();
            await img.SaveAsPngAsync(ms);
            using var pix = Pix.LoadFromMemory(ms.ToArray());

            using var engine = new TesseractEngine(Path.Combine(AppContext.BaseDirectory, OcrConstants.TesseractDataPath),
                OcrConstants.TesseractLanguage, EngineMode.Default);
            engine.DefaultPageSegMode = PageSegMode.Auto;

            using var page = engine.Process(pix);
            string text = page.GetText() ?? string.Empty;

            text = text.Replace("\r", "");
            text = Regex.Replace(text, @"[ ]{2,}", " ");

            return text.Trim();
        }
        private string ExtractIdNumber(string text)
        {
            var match = Regex.Match(text, @"\b\d{12}\b");
            return match.Success ? match.Value : "";
        }
        private string ExtractFullName(string rawText)
        {
            if (string.IsNullOrWhiteSpace(rawText))
                return string.Empty;

            var lines = rawText
                .Split('\n')
                .Select(s => s.Trim())
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .ToList();

            int idx = lines.FindIndex(l =>
                Regex.IsMatch(l, @"HO.?VA.?TEN|FULL.?NAME", RegexOptions.IgnoreCase));

            if (idx != -1 && idx + 1 < lines.Count)
            {
                string candidate = lines[idx + 1];
                return ConvertToName(candidate);
            }

            foreach (var line in lines)
            {
                var name = ConvertToName(line);
                if (!string.IsNullOrEmpty(name))
                {
                    return name;
                }
            }

            return string.Empty;
        }
        private string ConvertToName(string line)
        {
            if (string.IsNullOrWhiteSpace(line))
                return string.Empty;

            line = Regex.Replace(line, @"[^A-Za-zÀ-ỹ\s]", " ").Trim();

            string noDia = RemoveDiacritics(line).ToUpper();

            var match = Regex.Match(noDia,
                @"([A-Z]{2,}(?:\s+[A-Z]{2,})+)"
            );

            if (!match.Success)
                return string.Empty;

            return Regex.Replace(match.Value, @"\s+", " ").Trim();
        }
        private string RemoveDiacritics(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return string.Empty;

            var normalized = text.Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder();

            foreach (var ch in normalized)
            {
                var uc = CharUnicodeInfo.GetUnicodeCategory(ch);
                if (uc != UnicodeCategory.NonSpacingMark)
                    sb.Append(ch);
            }

            return sb.ToString().Normalize(NormalizationForm.FormC);
        }

        public async Task<HomeItemDataDto> ScanHomeItemAsync(List<byte[]> filesBytes)
        {
            if (filesBytes == null || !filesBytes.Any())
            {
                return new HomeItemDataDto(); 
            }
            var ocrTasks = filesBytes.Select(file => ExtractTextAsync(file));
            string[] ocrResults = await Task.WhenAll(ocrTasks);
            string combinedOcrText = string.Join("\n --- HẾT ẢNH, SANG ẢNH KHÁC --- \n", ocrResults);
            var dto = await AskGptForHomeItemDataAsync(combinedOcrText);
            return dto;
        }

        private async Task<HomeItemDataDto> AskGptForHomeItemDataAsync(string ocrText)
        {
            if (string.IsNullOrWhiteSpace(ocrText))
            {
                return new HomeItemDataDto();
            }
            var prompt = $@"Nhiệm vụ của bạn là tổng hợp thông tin từ CÁC ĐOẠN VĂN BẢN OCR (từ nhiều ảnh khác nhau) dưới đây để điền vào JSON.
                ### CẤU TRÚC JSON MỤC TIÊU:
                {{
                    ""Name"": ""Tên sản phẩm"",
                    ""Brand"": ""Thương hiệu"",
                    ""Type"": ""Loại sản phẩm"",
                    ""ModelNumber"": ""Mã model (Tìm kỹ ở mọi đoạn văn bản)"",
                    ""SerialNumber"": ""Số sê-ri (Thường nằm ở đoạn văn bản chứa tem kỹ thuật/mặt sau)""
                }}
                ### QUY TẮC QUAN TRỌNG:
                1. Dữ liệu được ghép từ nhiều ảnh (phân cách bởi '--- HẾT ẢNH...'). Hãy tìm kiếm thông tin rải rác ở tất cả các phần.
                2. Nếu ảnh 1 có Brand, ảnh 2 có Serial, hãy gộp chúng lại vào cùng 1 JSON kết quả.
                3. Ưu tiên độ chính xác tuyệt đối cho Serial Number.
                ### DỮ LIỆU OCR ĐẦU VÀO:
                {ocrText}";
            try
            {
                var response = await _chatbotService.GetChatResponseAsync(prompt);
                response = response.Replace("```json", "").Replace("```", "").Trim();
                var result = JsonSerializer.Deserialize<HomeItemDataDto>(response,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true,
                        ReadCommentHandling = JsonCommentHandling.Skip, 
                        AllowTrailingCommas = true
                    });

                return result ?? new HomeItemDataDto();
            }
            catch
            {
                return new HomeItemDataDto();
            }
        }
    }
}