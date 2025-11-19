using HSP.Core.Dtos.FileDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class FileController : ControllerBase
	{
		private readonly IFileService _fileService;

        public FileController(IFileService fileService)
		{
			_fileService = fileService;
		}
		[HttpPost("upload")]
		public async Task<IActionResult> Upload(FileUploadDto input)
		{
			if (!ModelState.IsValid)
				return BadRequest("không có file nào được upload");

			try
			{
				var result = await _fileService.UploadAsync(input);
				return Ok(result);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new { message = ex.Message });
			}
			catch (InvalidOperationException ex)
			{
				return BadRequest(new { message = ex.Message });
			}
			catch (Exception ex)
			{
				return StatusCode(500, ex.Message);
			}
		}
		//[HttpPost("upload-many")]
		//[RequestSizeLimit(50_000_000)] 
		//public async Task<IActionResult> UploadMany([FromForm] List<IFormFile> files, [FromForm] Guid objectId, [FromForm] string objectTypeName)
		//{
		//	if (files == null || files.Count == 0)
		//		return BadRequest("không có file nào được upload");

		//	var uploadDtos = files.Select(f => new FileUploadDto
		//	{
		//		File = f,
		//		ObjectId = objectId,
		//		ObjectTypeName = objectTypeName
		//	});

		//	try
		//	{
		//		var results = await _fileService.UploadManyAsync(uploadDtos);
		//		return Ok(results);
		//	}
		//	catch (ArgumentException ex)
		//	{
		//		return BadRequest(new { message = ex.Message });
		//	}
		//	catch (InvalidOperationException ex)
		//	{
		//		return BadRequest(new { message = ex.Message });
		//	}
		//	catch (Exception ex)
		//	{
		//		return StatusCode(500, ex.Message );
		//	}
		//}
		[HttpGet("{objectTypeName}/{objectId}")]
		public async Task<IActionResult> GetFiles(Guid objectId, string objectTypeName)
		{
			try
			{
				var files = await _fileService.GetFilesAsync(objectId, objectTypeName);
				return Ok(files);
			}
			catch (Exception ex)
			{
				return StatusCode(500, ex.Message);
			}
		}
		[HttpDelete("{fileId}")]
		public async Task<IActionResult> Delete(Guid fileId)
		{
			try
			{
				await _fileService.DeleteAsync(fileId);
				return NoContent();
			}
			catch (Exception ex)
			{
				return StatusCode(500, ex.Message);
			}
		}

        [HttpGet("preview")]
        public async Task<IActionResult> Preview([FromQuery] string filePath)
        {
            try
            {
                var fileData = await _fileService.GetFileForDownload(filePath);

                return PhysicalFile(fileData.PhysicalPath, fileData.ContentType, enableRangeProcessing: true);
            }
            catch (FileNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi máy chủ: {ex.Message}");
            }
        }

        [HttpGet("download")]
        public async Task<IActionResult> Download([FromQuery] string filePath)
        {
            try
            {
                var fileData = await _fileService.GetFileForDownload(filePath);

                return PhysicalFile(fileData.PhysicalPath, fileData.ContentType, fileData.FileName);
            }
            catch (FileNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi máy chủ: {ex.Message}");
            }
        }
    }
}
