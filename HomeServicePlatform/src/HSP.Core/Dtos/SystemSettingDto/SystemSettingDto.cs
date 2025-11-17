namespace HSP.Core.Dtos.SystemSettingDto
{
	public class SystemSettingDto
	{
		public Guid Id { get; set; }
		public string Key { get; set; } = null!;
		public string Value { get; set; } = null!;
		public string? Description { get; set; }
		public string? Group { get; set; }
		public bool IsSensitive { get; set; }
		public DateTime DateCreated { get; set; }
		public DateTime DateModified { get; set; }
	}
}
