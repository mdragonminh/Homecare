using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.ServiceDto
{
	public class CreateHomeServiceDto
	{
		[Required]
		[StringLength(100)]
		public string Name { get; set; } = null!;
		[StringLength(500)]
		public string? Description { get; set; }
		public DateTime DateCreated { get; set; }
		public Guid? CreatedBy { get; set; }
	}
}
