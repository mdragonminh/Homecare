using HSP.Core.Dtos.FileDto;
using Microsoft.AspNetCore.Http;

namespace HSP.Service.Interfaces
{
	public interface IFileService
	{
		Task<FileDto> UploadAsync(FileUploadDto input);
		Task<IEnumerable<FileDto>> UploadManyAsync(IEnumerable<FileUploadDto> inputs);
		Task<IEnumerable<FileDto>> GetFilesAsync(GetFilesRequestDto input);
        Task DeleteAsync(Guid fileId);
        Task<FileDownloadResult> GetFileForDownload(string relativePath);
    }
}
