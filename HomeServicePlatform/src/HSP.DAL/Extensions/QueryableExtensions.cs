using HSP.Core.Dtos.Shared;
using Microsoft.EntityFrameworkCore;
using System.Linq.Dynamic.Core;
using System.Linq.Expressions;

namespace HSP.DAL.Extensions
{
	public static class QueryableExtensions
	{
		public static async Task<PagedList<T>> ToPagedListAsync<T>(
						this IQueryable<T> source,
						PaginationParams paginationParams) where T : class
		{
			var query = source.AsNoTracking();
			var count = await source.CountAsync();

			if (!string.IsNullOrWhiteSpace(paginationParams.OrderBy))
			{
				query = query.OrderBy(paginationParams.OrderBy);
			}
			var items = await query
					.Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
					.Take(paginationParams.PageSize)
					.ToListAsync();
			return new PagedList<T>(items, count, paginationParams.PageNumber, paginationParams.PageSize);
		}
		public static IQueryable<T> WhereIf<T>(
				this IQueryable<T> query,
				bool condition,
				Expression<Func<T, bool>> predicate) where T : class
		{
			return condition ? query.Where(predicate) : query;
		}
	}
}
