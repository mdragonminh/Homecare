using HSP.Core.Abstractions.DataAccess;
using HSP.Core.Entities;
using HSP.DAL.Data;
using Microsoft.EntityFrameworkCore;

namespace HSP.DAL.Repositories
{
	public class HomeRepository : Repository<Home, Guid>, IHomeRepository
	{
		public HomeRepository(ApplicationDbContext context) : base(context)
		{
		}

		public async Task<bool> IsUserOwnerAsync(Guid homeId, string userId)
		{
			return await _context.Homes
							 .Include(h => h.CustomerProfile)
							 .AnyAsync(h => h.Id == homeId && h.CustomerProfile.Id.ToString() == userId);
		}
	}
}
