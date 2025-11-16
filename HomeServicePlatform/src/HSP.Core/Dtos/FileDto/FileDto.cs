using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
namespace HSP.Core.Dtos.FileDto
{
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

    public class FileDownloadResult
    {
        public string PhysicalPath { get; set; }
        public string ContentType { get; set; }
        public string FileName { get; set; }
    }
	public class CertificateCheckDto
	{
        public bool IsCertificate { get; set; }
        public bool IsRelatedToService { get; set; }
        public string Reason { get; set; }
    }
}
