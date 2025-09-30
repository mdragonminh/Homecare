using Microsoft.EntityFrameworkCore.Storage;

namespace HSP.Core.Interfaces.DataAccess
{
	public interface IUnitOfWork : IAsyncDisposable
	{
		ITechnicianProfileRepository TechnicianProfiles { get; }
		Task<int> SaveChangesAsync();
		Task<IDbContextTransaction> BeginTransactionAsync();
		Task CommitTransactionAsync();
		Task RollbackTransactionAsync();
	}
}
