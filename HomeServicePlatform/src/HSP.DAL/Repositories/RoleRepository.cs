using HSP.Core.Abstractions.DataAccess;
using HSP.Core.Entities;
using Microsoft.AspNetCore.Identity;

namespace HSP.DAL.Repositories
{
	public class RoleRepository : IRoleRepository
	{
		private readonly RoleManager<AppRole> _roleManager;

		public RoleRepository(RoleManager<AppRole> roleManager)
		{
			_roleManager = roleManager;
		}

		public async Task<bool> RoleExistsAsync(string roleName)
		{
			return await _roleManager.RoleExistsAsync(roleName);
		}
	}
}
