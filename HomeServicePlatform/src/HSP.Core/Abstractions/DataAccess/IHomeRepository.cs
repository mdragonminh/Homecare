using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;

namespace HSP.Core.Abstractions.DataAccess
{
	public interface IHomeRepository : IRepository<Home, Guid>
	{
		Task<bool> IsUserOwnerAsync(Guid homeId, string userId);
	}
}
