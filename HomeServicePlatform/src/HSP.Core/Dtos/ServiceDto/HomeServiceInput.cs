using HSP.Core.Dtos.Shared;

namespace HSP.Core.Dtos.ServiceDto
{
	public class HomeServiceInput : PaginationParams
	{
		public string? Search { get; set; }
		public Guid? CategoryId { get; set; }
	}
}
