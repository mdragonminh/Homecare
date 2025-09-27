using HSP.Core.Entities;
using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.HomeDto
{
	public class UpdateHomeDto 
	{
		[Required]
		[StringLength(100)]
		public string Name { get; set; } = string.Empty;

		[Required]
		[StringLength(200)]
		public string Address { get; set; } = string.Empty;
	}
}
