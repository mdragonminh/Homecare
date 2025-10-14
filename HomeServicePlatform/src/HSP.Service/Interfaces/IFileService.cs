using Microsoft.AspNetCore.Http;
using HSP.Core.Entities;

namespace HSP.Service.Interfaces
{
    public interface IFileService
    {
        Task<string> UploadFileAsync(IFormFile file, string subFolder = "");
        Task<List<string>> UploadMultipleFilesAsync(IList<IFormFile> files, string subFolder = "");
        Task<bool> DeleteFileAsync(string filePath);
        Task<HSP.Core.Entities.File> SaveFileInfoAsync(string fileName, string filePath, string fileType, long fileSize, Guid uploadedBy);
        Task<bool> CreateFileRelationAsync(Guid fileId, Guid objectId, Guid objectTypeId, string relationType);
        bool ValidateFileType(IFormFile file, string[] allowedExtensions);
        bool ValidateFileSize(IFormFile file, long maxSizeInBytes);
    }
}
