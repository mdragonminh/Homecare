using HSP.Core.Interfaces.DataAccess;
using HSP.DAL.Data;
using HSP.DAL.Repositories;
using Microsoft.EntityFrameworkCore.Storage;

namespace HSP.DAL.UnitOfWorks
{
	public class UnitOfWork : IUnitOfWork
	{
		private readonly ApplicationDbContext _context;
		private IDbContextTransaction? _currentTransaction;
		private ITechnicianProfileRepository? _technicianProfiles;

		public UnitOfWork(ApplicationDbContext context)
		{
			_context = context;
		}

		public ITechnicianProfileRepository TechnicianProfiles => 
			_technicianProfiles ??= new TechnicianProfileRepository(_context);

		public async Task<IDbContextTransaction> BeginTransactionAsync()
		{
			if (_currentTransaction != null)
			{
				return _currentTransaction;
			}

			_currentTransaction = await _context.Database.BeginTransactionAsync();
			return _currentTransaction;
		}

		public async Task CommitTransactionAsync()
		{
			try
			{
				await _context.SaveChangesAsync();

				if (_currentTransaction != null)
				{
					await _currentTransaction.CommitAsync();
				}
			}
			catch
			{
				await RollbackTransactionAsync();
				throw;
			}
			finally
			{
				if (_currentTransaction != null)
				{
					await _currentTransaction.DisposeAsync();
					_currentTransaction = null; 
				}
			}
		}

		public async ValueTask DisposeAsync()
		{
			if (_currentTransaction != null)
			{
				await _currentTransaction.DisposeAsync();
			}
			await _context.DisposeAsync();
		}

		public async Task RollbackTransactionAsync()
		{
			try
			{
				if (_currentTransaction != null)
				{
					await _currentTransaction.RollbackAsync();
				}
			}
			finally
			{
				if (_currentTransaction != null)
				{
					await _currentTransaction.DisposeAsync();
					_currentTransaction = null;
				}
			}
		}

		public async Task<int> SaveChangesAsync()
		{
			return await _context.SaveChangesAsync();
		}
	}
}
