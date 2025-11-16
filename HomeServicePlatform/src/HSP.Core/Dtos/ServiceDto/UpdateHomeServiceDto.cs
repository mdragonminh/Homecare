using HSP.Core.Abstractions.Entity;
using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.ServiceDto
{
	public class UpdateHomeServiceDto 
	{
		[Required]
		[StringLength(100)]
		public string Name { get; set; } = null!;
		[Required]
		[Range(0, double.MaxValue)]
		public decimal Price { get; set; }
		[StringLength(500)]
		public string? Description { get; set; }
		public bool? IsDeleted { get; set; }
		public DateTime DateModified { get; set; }
		public Guid? ModifiedBy { get; set; }
	}
}
