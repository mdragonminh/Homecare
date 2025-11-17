using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.SystemSettingDto
{
	public class UpdateSystemSettingDto
	{
		[Required, MaxLength(500)]
		public string Value { get; set; } = null!;

		[MaxLength(1000)]
		public string? Description { get; set; }
	}
}
