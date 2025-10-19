using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HSP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FileController : ControllerBase
    {
        [HttpGet("download")]
        [AllowAnonymous]
        public async Task<IActionResult> DownloadFile([FromQuery] string filePath)
        {
            try
            {
                if (string.IsNullOrEmpty(filePath))
                {
                    return BadRequest(new { message = "File path is required" });
                }

                // Security: Ensure the file path is within the uploads directory and normalize
                var normalizedPath = filePath.Replace('\\', '/');
                if (!normalizedPath.StartsWith("uploads/"))
                {
                    return BadRequest(new { message = "Invalid file path" });
                }

                // Additional security: prevent path traversal attacks
                if (normalizedPath.Contains("../") || normalizedPath.Contains("..\\"))
                {
                    return BadRequest(new { message = "Invalid file path" });
                }

                // Get full file path
                var fullPath = Path.Combine(Directory.GetCurrentDirectory(), normalizedPath);

                // Check if file exists
                if (!System.IO.File.Exists(fullPath))
                {
                    return NotFound(new { message = "File not found" });
                }

                // Get file info
                var fileInfo = new FileInfo(fullPath);
                var fileName = fileInfo.Name;
                var mimeType = GetMimeType(fileName);

                // Read file bytes
                var fileBytes = await System.IO.File.ReadAllBytesAsync(fullPath);

                // Return file for download
                return File(fileBytes, mimeType, fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã có lỗi xảy ra khi download file", error = ex.Message });
            }
        }

        [HttpGet("preview")]
        [AllowAnonymous]
        public async Task<IActionResult> PreviewFile([FromQuery] string filePath)
        {
            try
            {
                if (string.IsNullOrEmpty(filePath))
                {
                    return BadRequest(new { message = "File path is required" });
                }

                // Security: Ensure the file path is within the uploads directory and normalize
                var normalizedPath = filePath.Replace('\\', '/');
                if (!normalizedPath.StartsWith("uploads/"))
                {
                    return BadRequest(new { message = "Invalid file path" });
                }

                // Additional security: prevent path traversal attacks
                if (normalizedPath.Contains("../") || normalizedPath.Contains("..\\"))
                {
                    return BadRequest(new { message = "Invalid file path" });
                }

                // Get full file path
                var fullPath = Path.Combine(Directory.GetCurrentDirectory(), normalizedPath);

                // Check if file exists
                if (!System.IO.File.Exists(fullPath))
                {
                    return NotFound(new { message = "File not found" });
                }

                // Get file info
                var fileInfo = new FileInfo(fullPath);
                var fileName = fileInfo.Name;
                var mimeType = GetMimeType(fileName);

                // Read file bytes
                var fileBytes = await System.IO.File.ReadAllBytesAsync(fullPath);

                // Return file for inline viewing (without forcing download)
                Response.Headers.Add("Content-Disposition", $"inline; filename=\"{fileName}\"");
                return File(fileBytes, mimeType);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã có lỗi xảy ra khi preview file", error = ex.Message });
            }
        }

        private string GetMimeType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".bmp" => "image/bmp",
                ".txt" => "text/plain",
                _ => "application/octet-stream"
            };
        }
    }
}
