using HSP.Core.Abstractions.Entity;
using System.Linq.Expressions;

namespace HSP.Core.Interfaces.DataAccess
{
	public interface IRepository<T,K> where T : BaseEntity<K>
	{
		IQueryable<T> GetAll(params Expression<Func<T, object>>[] includes);
		Task<T> GetByIdAsync(K id);
		Task<T> AddAsync(T entity);
		void Update(T entity);
		void SoftDelete(T entity);
		void HardDelete(T entity);
		Task RemoveRange(IEnumerable<T> entities);
		Task DeleteAsync(K id);
		Task<bool> AnyAsync(Expression<Func<T, bool>> predicate);
		Task AddRangeAsync(IEnumerable<T> entities);
	}
}
