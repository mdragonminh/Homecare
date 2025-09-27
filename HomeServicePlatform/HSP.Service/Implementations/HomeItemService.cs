using HSP.Core.Dtos.HomeItemDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Interfaces;
using HSP.DAL.Extensions;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HSP.Service.Implementations
{
	public class HomeItemService : BaseService, IHomeItemService
	{
		private readonly IRepository<HomeItem, Guid> _homeItemRepository;
		private readonly IRepository<Home, Guid> _homeRepository;
		public HomeItemService(IRepository<HomeItem, Guid> homeItemRepository,
			IRepository<Home, Guid> homeRepository,
		IUnitOfWork unitOfWork) : base(unitOfWork)
		{
			_homeItemRepository = homeItemRepository;
			_homeRepository = homeRepository;
		}

		public async Task<Guid> CreateHomeItemAsync(CreateHomeItemDto input)
		{
			if (input == null)
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

		public async Task<PagedList<HomeItemDto>> GetAllHomeItemsAsync(HomeItemInput input, Guid homeId, string userId)
		{
			var isOwner = await _homeRepository.GetAll()
				.Include(h => h.CustomerProfile)
				.AnyAsync(h => h.Id == homeId && h.CustomerProfile.UserId.ToString() == userId);
			if (!isOwner)
			{
				throw new UnauthorizedAccessException("User does not have access to these home items.");
			}
			var query = _homeItemRepository.GetAll()
			.WhereIf(!string.IsNullOrEmpty(input.Search), x => x.Name.ToLower().Contains(input.Search.ToLower()))
			.Where(x => x.HomeId == homeId);
			var homeItemDto = query.Select(x => new HomeItemDto
			{
				Id = x.Id,
				Name = x.Name,
				Brand = x.Brand,
				Notes = x.Notes,
				ModelNumber = x.ModelNumber,
				SerialNumber = x.SerialNumber,
				Type = x.Type,
				HomeId = x.HomeId
			});
			var pageHomeItems = await homeItemDto.ToPagedListAsync(input);
			return pageHomeItems;
		}
	}
}
