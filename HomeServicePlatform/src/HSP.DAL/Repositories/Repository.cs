using HSP.Core.Abstractions.Entity;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.Entity;
using HSP.DAL.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace HSP.DAL.Repositories
{
	public class Repository<T, K> : IRepository<T, K> where T : BaseEntity<K>
	{
		private readonly ApplicationDbContext _context;

		public Repository(ApplicationDbContext context)
		{
			_context = context;
		}

		public async Task<T> AddAsync(T entity)
		{
			await _context.Set<T>().AddAsync(entity);
			return entity;
		}

		public async Task AddRangeAsync(IEnumerable<T> entities)
		{
			await _context.Set<T>().AddRangeAsync(entities);
		}

		public async Task<bool> AnyAsync(Expression<Func<T, bool>> predicate)
		{
			return await _context.Set<T>().AnyAsync(predicate);
		}

		public void HardDelete(T entity)
		{
			_context.Set<T>().Remove(entity);
		}

		public void SoftDelete(T entity)
		{
			if (entity is not IHasSoftedDelete softDeletableEntity)
			{
				throw new InvalidOperationException("Entity type does not support soft delete.");
			}

			softDeletableEntity.IsDeleted = true;
			_context.Entry(entity).State = EntityState.Modified;
		}

		public async Task DeleteAsync(K id)
		{
			var entity = await _context.Set<T>().FindAsync(id);
			if (entity != null)
			{
				SoftDelete(entity);
			}
		}

		public IQueryable<T> GetAll(params Expression<Func<T, object>>[] includes)
		{
			IQueryable<T> query = _context.Set<T>().AsQueryable();

			if (includes != null && includes.Length > 0)
			{
				foreach (var include in includes)
				{
					query = query.Include(include);
				}
			}

			return query;
		}

		public async Task<T> GetByIdAsync(K id)
		{
			return await _context.Set<T>().FindAsync(id);
		}

		public void Update(T entity)
		{
			_context.Set<T>().Update(entity);
		}

		public async Task RemoveRange(IEnumerable<T> entities)
		{
			_context.Set<T>().RemoveRange(entities);
			await Task.CompletedTask;
		}
	}
}
