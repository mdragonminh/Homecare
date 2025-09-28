using Microsoft.EntityFrameworkCore.Storage;

namespace HSP.Core.Interfaces.DataAccess
{
	public interface IUnitOfWork : IAsyncDisposable
	{
		Task<int> SaveChangesAsync();
		Task<IDbContextTransaction> BeginTransactionAsync();
		Task CommitTransactionAsync();
		Task RollbackTransactionAsync();
	}
}
