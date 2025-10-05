using HSP.Core.Entities;

namespace HSP.Core.Dtos.HomeItemDto
{
	public class HomeItemDto : BaseEntity<Guid>
	{
		public string Name { get; set; }
		public string? Brand { get; set; }
		public string Type { get; set; }
		public string? ModelNumber { get; set; }
		public string? SerialNumber { get; set; }
		public string? Notes { get; set; }
		public Guid HomeId { get; set; }
	}
}
