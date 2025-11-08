using HSP.Core.Abstractions.Entity;

namespace HSP.Core.Dtos.ServiceDto
{
	public class HomePageServiceDto : BaseEntity<Guid>
	{
		public string Name { get; set; }
	}
}
