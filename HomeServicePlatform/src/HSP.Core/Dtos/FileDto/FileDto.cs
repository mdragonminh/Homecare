using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
namespace HSP.Core.Dtos.FileDto
{
	//public class FileUploadRequest
	//{
	//    public string FileName { get; set; } = string.Empty;
	//    public string FilePath { get; set; } = string.Empty;
	//    public string FileType { get; set; } = string.Empty;
	//    public long FileSize { get; set; }
	//    public string? RelationType { get; set; }
	//    public Guid UploadedBy { get; set; }
	//}

	//public class FileResponseDto
	//{
	//    public Guid Id { get; set; }
	//    public string FileName { get; set; } = string.Empty;
	//    public string FilePath { get; set; } = string.Empty;
	//    public string FileType { get; set; } = string.Empty;
	//    public long FileSize { get; set; }
	//    public string? RelationType { get; set; }
	//    public DateTime DateCreated { get; set; }
	//}

	//public class AvatarUploadResponseDto
	//{
	//    public bool Success { get; set; }
	//    public string Message { get; set; } = string.Empty;
	//    public FileResponseDto? File { get; set; }
	//    public string? AvatarUrl { get; set; }
	//}
	public class FileUploadDto
	{
		[Required]
		public Guid UserId { get; set; }
		[Required]
		public IFormFile File { get; set; }
		public Guid ObjectId { get; set; }
		[Required]
		public string ObjectTypeName { get; set; }
		public string RelationType { get; set; }
	}

	public class FileDto
	{
		public Guid Id { get; set; }
		public string FileName { get; set; }
		public string FilePath { get; set; }
		public string FileType { get; set; }
		public long FileSize { get; set; }
	}
}
