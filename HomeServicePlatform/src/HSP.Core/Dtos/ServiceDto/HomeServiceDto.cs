using HSP.Core.Entities;

namespace HSP.Core.Dtos.ServiceDto
{
	public class HomeServiceDto : BaseEntity<Guid>
	{
		public string Name { get; set; }
		public decimal BasePrice { get; set; }
		public ServiceCategoryDto? Category { get; set; }
	}
	public class ServiceCategoryDto : BaseEntity<Guid>
	{
		public string Name { get; set; } = string.Empty;
		public string? Description { get; set; }
	}
}
