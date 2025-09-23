using HSP.Service.Dtos.HomeDto;

namespace HSP.Service.Interfaces
{
	public interface IHomeService
	{
		public Task<Guid> CreateHomeAsync(CreateHomeDto input);
	}
}
