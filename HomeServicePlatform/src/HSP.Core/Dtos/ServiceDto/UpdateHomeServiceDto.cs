using HSP.Core.Abstractions.Entity;
using System.ComponentModel.DataAnnotations;
using HSP.Core.Resources;

namespace HSP.Core.Dtos.ServiceDto
{
	public class UpdateHomeServiceDto 
	{
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "ServiceNameRequired")]
		[StringLength(100, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "ServiceNameMaxLength")]
		public string Name { get; set; } = null!;
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "ServicePriceRequired")]
		[Range(0, double.MaxValue, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "ServicePriceRange")]
		public decimal Price { get; set; }
		[StringLength(500, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "ServiceDescriptionMaxLength")]
		public string? Description { get; set; }
		public bool? IsDeleted { get; set; }
		public DateTime DateModified { get; set; }
		public Guid? ModifiedBy { get; set; }
	}
}
