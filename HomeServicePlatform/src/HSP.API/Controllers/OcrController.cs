using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class OcrController : ControllerBase
	{
		private readonly IOcrService _ocrService;

		public OcrController(IOcrService ocrService)
		{
			_ocrService = ocrService;
		}
		[HttpPost("scan")] 
		public async Task<IActionResult> ScanCccd(IFormFile file)
		{
			if (file == null || file.Length == 0)
			{
				return BadRequest(new { message = "Chưa có file nào được tải lên." });
			}

			byte[] fileBytes;
			using (var ms = new MemoryStream())
			{
				await file.CopyToAsync(ms);
				fileBytes = ms.ToArray();
			}

			try
			{
				var result = await _ocrService.ScanCccdAsync(fileBytes);

				return Ok(result);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { message = $"Lỗi máy chủ nội bộ: {ex.Message}" });
			}
		}
	}
}
