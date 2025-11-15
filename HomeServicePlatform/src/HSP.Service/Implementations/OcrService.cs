using HSP.Core.Dtos.OcrDto;
using HSP.Service.Interfaces;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Tesseract;

namespace HSP.Service.Implementations
{
	public class OcrService : IOcrService
	{
		private readonly TesseractEngine _engine;

		public OcrService(TesseractEngine engine)
		{
			_engine = engine;
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
            _engine.DefaultPageSegMode = PageSegMode.Auto;

            using var page = _engine.Process(pix);
            string text = page.GetText() ?? "";

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
                return "";

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

            return "";
        }

        private string ConvertToName(string line)
        {
            if (string.IsNullOrWhiteSpace(line))
                return "";

            line = Regex.Replace(line, @"[^A-Za-zÀ-ỹ\s]", " ").Trim();

            string noDia = RemoveDiacritics(line).ToUpper();

            var match = Regex.Match(noDia,
                @"([A-Z]{2,}(?:\s+[A-Z]{2,})+)"
            );

            if (!match.Success)
                return "";

            return Regex.Replace(match.Value, @"\s+", " ").Trim();
        }

        private string RemoveDiacritics(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return "";

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
    }
}