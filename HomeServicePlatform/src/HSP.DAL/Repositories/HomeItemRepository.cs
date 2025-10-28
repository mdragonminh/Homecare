using HSP.Core.Abstractions.DataAccess;
using HSP.Core.Entities;
using HSP.DAL.Data;
using Microsoft.EntityFrameworkCore;

namespace HSP.DAL.Repositories
{
	public class HomeItemRepository : Repository<HomeItem, Guid>, IHomeItemRepository
	{
		public HomeItemRepository(ApplicationDbContext context) : base(context)
		{
		}

		public async Task<HomeItem?> GetOwnedItemAsync(Guid itemId, string userId)
		{
			return await _context.HomeItems
						.Include(x => x.Home)
						.ThenInclude(h => h.CustomerProfile)
						.FirstOrDefaultAsync(i => i.Id == itemId && i.Home.CustomerProfile.Id.ToString() == userId);
		}
	}
}
