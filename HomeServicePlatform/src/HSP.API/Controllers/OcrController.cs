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
            if (file.Length > Core.Constants.FileConstants.MaxFileSize)
            {
                return BadRequest($"File '{file.FileName}' quá lớn. Vui lòng upload ảnh dưới 5MB.");
            }
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!Core.Constants.FileConstants.AllowedImageExtensions.Contains(ext))
            {
                return BadRequest($"File '{file.FileName}' không hợp lệ. Chỉ chấp nhận .jpg, .jpeg, .png");
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
		[HttpPost("scan-homeitem")]
		public async Task<IActionResult> ScanHomeItem(List<IFormFile> files)
		{
            if (files == null || files.Count == 0)
            {
                return BadRequest(new { message = "Vui lòng tải lên ít nhất 1 ảnh." });
            }
            if (files.Count > 2)
			{
				return BadRequest(new { message = "bạn chỉ được phép tải lên tối đa 2 file" });
			}
            var imagesData = new List<byte[]>();

            foreach (var file in files)
            {
                if (file.Length > 0)
                {
					if(file.Length > Core.Constants.FileConstants.MaxFileSize)
					{
						return BadRequest($"File '{file.FileName}' quá lớn. Vui lòng upload ảnh dưới 5MB.");
					}
					var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
					if (!Core.Constants.FileConstants.AllowedImageExtensions.Contains(ext))
					{
						return BadRequest($"File '{file.FileName}' không hợp lệ. Chỉ chấp nhận .jpg, .jpeg, .png");
					}
                    using (var memoryStream = new MemoryStream())
                    {
                        await file.CopyToAsync(memoryStream);
                        imagesData.Add(memoryStream.ToArray());
                    }
                }
            }
            try
			{
				var result = await _ocrService.ScanHomeItemAsync(imagesData);
				return Ok(result);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { message = $"Lỗi máy chủ nội bộ: {ex.Message}" });
			}
        }
    }
}
