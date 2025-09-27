using HSP.Core.Dtos.HomeItemDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Interfaces;
using HSP.DAL.Extensions;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

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

		public async Task<bool> DeleteHomeItemAsync(Guid homeItemId, string userId)
		{
			var itemToDelete = await _homeItemRepository.GetAll()
				.Include(x => x.Home)
				.ThenInclude(h => h.CustomerProfile)
				.ThenInclude(cp=>cp.User)
				.FirstOrDefaultAsync(x=>x.Id.Equals(homeItemId));
			if (itemToDelete == null || !itemToDelete.Home.CustomerProfile.UserId.ToString().Equals(userId))
			{
				throw new ValidationException("Home item not found or you do not have permission to delete this home item.");
			}
			await _homeItemRepository.DeleteAsync(homeItemId);
			await _unitOfWork.SaveChangesAsync();
			return true;
		}

		public async Task<PagedList<HomeItemDto>> GetAllHomeItemsAsync(HomeItemInput input, Guid homeId)
		{
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
