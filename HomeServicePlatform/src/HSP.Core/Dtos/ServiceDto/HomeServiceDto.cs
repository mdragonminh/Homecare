using HSP.Core.Abstractions.Entity;

namespace HSP.Core.Dtos.ServiceDto
{
	public class HomeServiceDto : BaseEntity<Guid>
	{
		public string Name { get; set; }
		public decimal BasePrice { get; set; }
	}
	public class ServiceCategoryDto : BaseEntity<Guid>
	{
		public string Name { get; set; } = string.Empty;
		public string? Description { get; set; }
	}
	public class ServiceGroupDto
	{
		public ServiceCategoryDto Category { get; set; } = new();
		public List<HomeServiceDto> Services { get; set; } = new();
	}
}
