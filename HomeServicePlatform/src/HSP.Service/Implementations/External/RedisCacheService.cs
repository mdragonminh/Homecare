using HSP.Core.Interfaces.External;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace HSP.Service.Implementations.External
{
	public class RedisCacheService : IRedisCacheService
	{
		private readonly IDistributedCache _cache;

		public RedisCacheService(IDistributedCache cache)
		{
			_cache = cache;
		}

		public async Task<T?> GetAsync<T>(string key)
		{
			var json = await _cache.GetStringAsync(key);
			return json == null ? default : JsonSerializer.Deserialize<T>(json);
		}

		public async Task RemoveAsync(string key)
		{
			await _cache.RemoveAsync(key);
		}

		public async Task SetAsync<T>(string key, T value, TimeSpan? ttl = null)
		{
			var json = JsonSerializer.Serialize(value);
			var options = new DistributedCacheEntryOptions
			{
				AbsoluteExpirationRelativeToNow = ttl ?? TimeSpan.FromMinutes(5)
			};
			await _cache.SetStringAsync(key, json, options);
		}
	}
}
