using HSP.Core.Dtos.Shared;

namespace HSP.Core.Dtos.HomeItemDto
{
	public class HomeItemInput : PaginationParams
	{
		public string? Search { get; set; }
	}
}
