using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.SystemSettingDto
{
	public class CreateSystemSettingDto
	{
		[Required, MaxLength(100)]
		public string Key { get; set; } = null!;

		[Required, MaxLength(500)]
		public string Value { get; set; } = null!;

		[MaxLength(1000)]
		public string? Description { get; set; }

		[MaxLength(50)]
		public string? Group { get; set; }

		public bool IsSensitive { get; set; } = false;
		public Guid? CreatedBy { get; set; }
    }
}
