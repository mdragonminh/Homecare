using HSP.API.Extensions;
using HSP.Core.Constans;
using HSP.Core.Constants;
using HSP.Core.Dtos.FileDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HSP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FileController : ControllerBase
    {
        private readonly IFileService _fileService;
        private readonly ITechnicianProfileService _technicianProfileService;
        public FileController(IFileService fileService, ITechnicianProfileService technicianProfileService)
        {
            _fileService = fileService;
            _technicianProfileService
                = technicianProfileService;
        }
        [HttpPost("upload")]
        public async Task<IActionResult> Upload(FileUploadDto input)
        {
            if (!ModelState.IsValid)
                return BadRequest("không có file nào được upload");

            try
            {
                var UserId = User.GetUserId();
                input.UserId = UserId;
                if (User.GetUserRole() == RoleNames.Technician)
                {
                   
                    if (input.RelationType == FileConstants.CheckInProof ||
                        input.RelationType == FileConstants.CheckOutProof)
                    {
                      
                    }
                    else
                    {
                        
                        input.ObjectId = await _technicianProfileService.GetTechnicianIdByUserId(UserId);
                    }
                }
                else
                {
                   
                    input.ObjectId = UserId;
                }

                if (input.RelationType == FileConstants.Avatar)
                {
                    await RemoveOldAvatarAsync(input.ObjectId, input.ObjectTypeName, input.RelationType);
                }
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
        private async Task RemoveOldAvatarAsync(Guid objectId, string objectTypeName, string relationType)
        {
            var oldAvatars = await _fileService.GetFilesAsync(new GetFilesRequestDto
            {
                objectId = objectId,
                objectTypeName = objectTypeName,
                relationType = relationType
            });

            foreach (var file in oldAvatars)
            {
                await _fileService.DeleteFileAsync(file.Id);
            }
        }

        [HttpGet("{objectTypeName}/{objectId}/{relationType}")]
        public async Task<IActionResult> GetFiles(Guid objectId, string objectTypeName, string relationType)
        {
            try
            {
                var files = await _fileService.GetFilesAsync(new GetFilesRequestDto
                {
                    objectId = objectId,
                    objectTypeName = objectTypeName,
                    relationType = relationType
                });
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
