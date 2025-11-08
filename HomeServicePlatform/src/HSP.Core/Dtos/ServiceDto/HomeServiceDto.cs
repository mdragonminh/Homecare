using HSP.Core.Abstractions.Entity;

namespace HSP.Core.Dtos.ServiceDto
{
	public class HomeServiceDto : BaseEntity<Guid>
	{
		public string Name { get; set; }
	}
	public class AdminHomeServiceDto : BaseEntity<Guid>
	{
		public string? Name { get; set; }
		public decimal Price { get; set; }
		public string? Description { get; set; }
	}
}
