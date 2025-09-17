using HSP.Core.Entities;
using HSP.Core.Interfaces;
using System.Linq.Expressions;

namespace HSP.DAL.Repositories
{
	public class Repository<T, K> : IRepository<T, K> where T : BaseEntity<K>
	{
		public Task<T> AddAsync(T entity)
		{
			throw new NotImplementedException();
		}

		public Task AddRangeAsync(IEnumerable<T> entities)
		{
			throw new NotImplementedException();
		}

		public Task<bool> AnyAsync(Expression<Func<T, bool>> predicate)
		{
			throw new NotImplementedException();
		}

		public void Delete(T entity)
		{
			throw new NotImplementedException();
		}

		public Task DeleteAsync(K id)
		{
			throw new NotImplementedException();
		}

		public IQueryable<T> GetAll(params Expression<Func<T, object>>[] includes)
		{
			throw new NotImplementedException();
		}

		public Task<T> GetByIdAsync(K id)
		{
			throw new NotImplementedException();
		}

		public void Update(T entity)
		{
			throw new NotImplementedException();
		}
	}
}
