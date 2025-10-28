using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;

namespace HSP.Core.Abstractions.DataAccess
{
	public interface IHomeItemRepository : IRepository<HomeItem, Guid>
	{
		Task<HomeItem?> GetOwnedItemAsync(Guid itemId, string userId);
	}
}
