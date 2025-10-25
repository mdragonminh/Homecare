namespace HSP.Core.Constants
{
	public static class FileConstants
	{
		public static readonly string[] AllowedImageExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".bmp" };
		public static readonly string[] AllowedDocumentExtensions = { ".pdf", ".doc", ".docx", ".txt" };
		public const long MaxFileSize = 10 * 1024 * 1024; 
		public const string UploadRoot = "uploads";
	}
}
