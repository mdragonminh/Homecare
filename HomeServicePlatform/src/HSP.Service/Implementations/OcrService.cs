using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Http;
using System.Text.RegularExpressions;
using Tesseract;

namespace HSP.Service.Implementations
{
	public class OcrService : IOcrService
	{
		public async Task<string?> ExtractCitizenIdAsync(IFormFile file)
		{
			if (file == null || file.Length == 0)
				throw new ArgumentException("File upload không hợp lệ.");

			var tempPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}_{file.FileName}");
			using (var stream = new FileStream(tempPath, FileMode.Create))
			{
				await file.CopyToAsync(stream);
			}

			try
			{
				using var engine = new TesseractEngine(@"./tessdata", "vie+eng", EngineMode.Default);

				using var img = Pix.LoadFromFile(tempPath);
				using var page = engine.Process(img);

				var text = page.GetText();

				var match = Regex.Match(text, @"\b\d{9,12}\b");

				return match.Success ? match.Value : null;
			}
			catch (Exception ex)
			{
				return null;
			}
			finally
			{
				if (File.Exists(tempPath))
					File.Delete(tempPath);
			}
		}
	}
}
