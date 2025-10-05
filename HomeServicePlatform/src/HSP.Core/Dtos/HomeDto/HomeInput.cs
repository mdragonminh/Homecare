using HSP.Core.Dtos.Shared;

namespace HSP.Core.Dtos.HomeDto
{
	public class HomeInput : PaginationParams
	{
		public string? Search { get; set; }
	}
}
