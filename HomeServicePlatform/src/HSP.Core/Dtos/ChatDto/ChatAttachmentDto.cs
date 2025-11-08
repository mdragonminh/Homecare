namespace HSP.Core.Dtos.ChatDto
{
	public class ChatAttachmentDto
	{
		public Guid Id { get; set; }
		public Guid MessageId { get; set; }
		public string FileName { get; set; } = string.Empty;
		public string FileUrl { get; set; } = string.Empty;
		public string? FileType { get; set; }
		public long FileSize { get; set; }
	}

	public class ChatAttachmentCreateDto
	{
		public string FileName { get; set; } = string.Empty;
		public string FileUrl { get; set; } = string.Empty;
		public string? FileType { get; set; }
		public long FileSize { get; set; }
	}
}