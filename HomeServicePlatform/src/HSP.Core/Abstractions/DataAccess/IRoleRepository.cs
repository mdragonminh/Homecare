namespace HSP.Core.Abstractions.DataAccess
{
	public interface IRoleRepository
	{
		Task<bool> RoleExistsAsync(string roleName);
	}
}
