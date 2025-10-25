using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.FileDto
{
	public class OcrUploadRequestDto
	{
		[Required]
		public IFormFile File { get; set; }
	}
}
