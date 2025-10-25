using HSP.Core.Dtos.FileDto;
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
		[HttpPost("citizen-id")]
		[Consumes("multipart/form-data")]
		public async Task<IActionResult> ExtractCitizenId([FromForm] OcrUploadRequestDto file)
		{
			if (file == null || file.File == null || file.File.Length == 0)
				return BadRequest("Vui lòng chọn file CCCD.");

			var citizenId = await _ocrService.ExtractCitizenIdAsync(file.File);

			if (string.IsNullOrEmpty(citizenId))
				return BadRequest("Không nhận diện được số CCCD.");

			return Ok(new { CitizenId = citizenId });
		}
	}
}