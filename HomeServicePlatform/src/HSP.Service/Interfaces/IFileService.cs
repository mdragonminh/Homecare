using HSP.Core.Dtos.FileDto;
using Microsoft.AspNetCore.Http;

namespace HSP.Service.Interfaces
{
	public interface IFileService
	{
		//Task<string> UploadFileAsync(IFormFile file, string subFolder = "");
		//Task<List<string>> UploadMultipleFilesAsync(IList<IFormFile> files, string subFolder = "");
		//Task<bool> DeleteFileAsync(string filePath);
		//Task<HSP.Core.Entities.File> SaveFileInfoAsync(string fileName, string filePath, string fileType, long fileSize, Guid uploadedBy);
		//Task<bool> CreateFileRelationAsync(Guid fileId, Guid objectId, Guid objectTypeId, string relationType);
		//bool ValidateFileType(IFormFile file, string[] allowedExtensions);
		//bool ValidateFileSize(IFormFile file, long maxSizeInBytes);
		Task<FileDto> UploadAsync(FileUploadDto input);
		Task<IEnumerable<FileDto>> UploadManyAsync(IEnumerable<FileUploadDto> inputs);
		Task<IEnumerable<FileDto>> GetFilesAsync(Guid objectId, string objectTypeName);
		Task DeleteAsync(Guid fileId);
        Task<FileDownloadResult> GetFileForDownload(string relativePath);
    }
}
