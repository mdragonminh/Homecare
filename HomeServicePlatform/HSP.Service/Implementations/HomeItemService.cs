using HSP.Core.Dtos.HomeItemDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Interfaces;
using HSP.Service.Interfaces;

namespace HSP.Service.Implementations
{
	public class HomeItemService : BaseService, IHomeItemService
	{
		private readonly IRepository<HomeItem, Guid> _homeItemRepository;
		public HomeItemService(IRepository<HomeItem, Guid> homeItemRepository, IUnitOfWork unitOfWork) : base(unitOfWork)
		{
			_homeItemRepository = homeItemRepository;
		}

		public async Task<Guid> CreateHomeItemAsync(CreateHomeItemDto input)
		{
			if(input == null)
			{
				throw new ArgumentException("input parameter can not be null");
			}
			var newHomeItem = new HomeItem
			{
				Name = input.Name,
				Brand = input.Brand,
				DateCreated = DateTime.UtcNow,
				ModelNumber = input.ModelNumber,
				Notes = input.Notes,
				SerialNumber = input.SerialNumber,
				Type = input.Type,
				HomeId = input.HomeId,
			};
			await _homeItemRepository.AddAsync(newHomeItem);
			await _unitOfWork.SaveChangesAsync();
			return newHomeItem.Id;
		}

		public Task<PagedList<HomeItemDto>> GetAllHomeItemsAsync(HomeItemInput input)
		{
			throw new NotImplementedException();
		}
	}
}
