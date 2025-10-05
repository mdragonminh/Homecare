using System.ComponentModel.DataAnnotations;

namespace HSP.Service.Dtos.HomeDto
{
	public class CreateHomeDto
	{
		[Required]
		[StringLength(100)]
		public string Name { get; set; } = string.Empty;

		[Required]
		[StringLength(200)]
		public string Address { get; set; } = string.Empty;
	}
}
