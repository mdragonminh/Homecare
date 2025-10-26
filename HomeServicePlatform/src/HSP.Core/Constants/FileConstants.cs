namespace HSP.Core.Constants
{
	public static class FileConstants
	{
		public static readonly string[] AllowedImageExtensions = { ".jpg", ".jpeg", ".png" };
		public static readonly string[] AllowedDocumentExtensions = { ".pdf" };
		public const long MaxFileSize = 10 * 1024 * 1024; 
		public const string UploadRoot = "uploads";
	}
}
