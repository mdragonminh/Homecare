using HSP.Core.Abstractions.DataAccess;
using HSP.Core.Dtos.HomeItemDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.DAL.Extensions;
using HSP.Service.Interfaces;
using Microsoft.Extensions.Localization;
using System.ComponentModel.DataAnnotations;

namespace HSP.Service.Implementations
{
	public class HomeItemService : BaseService, IHomeItemService
	{
		private readonly IHomeItemRepository _homeItemRepository;
		private readonly IHomeRepository _homeRepository;
		public HomeItemService(IHomeItemRepository homeItemRepository,
			IHomeRepository homeRepository,
		IUnitOfWork unitOfWork, IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
		{
			_homeItemRepository = homeItemRepository;
			_homeRepository = homeRepository;
		}

		public async Task<Guid> CreateHomeItemAsync(CreateHomeItemDto input, string userId)
		{
			if (input == null)
			{
				throw new ArgumentException("input parameter can not be null");
			}
			var isOwner = await _homeRepository.IsUserOwnerAsync(input.HomeId, userId);
			if (!isOwner)
			{
				throw new UnauthorizedAccessException("User does not have access to these home items.");
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
			var itemToDelete = await _homeItemRepository.GetOwnedItemAsync(homeItemId, userId);
			if (itemToDelete == null)
				throw new ValidationException("Home item not found or you do not have permission.");
			await _homeItemRepository.DeleteAsync(homeItemId);
			await _unitOfWork.SaveChangesAsync();
			return true;
		}
		public async Task<PagedList<HomeItemDto>> GetAllHomeItemsAsync(HomeItemInput input, Guid homeId, string userId)
		{
			var query = _homeItemRepository.GetAll()
				.WhereIf(!string.IsNullOrEmpty(input.Search), x => x.Name.ToLower().Contains(input.Search.ToLower()))
				.Where(x => x.HomeId == homeId && x.Home.CustomerProfile.Id.ToString().Equals(userId));

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
		public async Task<HomeItemDto> GetHomeItemByIdAsync(Guid homeItemId, string userId)
		{
			var homeItem = await _homeItemRepository.GetOwnedItemAsync(homeItemId, userId);
			if (homeItem == null)
				throw new ValidationException("Home item not found or you do not have permission.");
			var homeItemDto = new HomeItemDto
			{
				Id = homeItem.Id,
				Name = homeItem.Name,
				Brand = homeItem.Brand,
				Notes = homeItem.Notes,
				ModelNumber = homeItem.ModelNumber,
				SerialNumber = homeItem.SerialNumber,
				Type = homeItem.Type,
				HomeId = homeItem.HomeId
			};
			return homeItemDto;
		}
		public async Task<bool> UpdateHomeItemAsync(Guid homeItemId, UpdateHomeItemDto input, string userId)
		{
			var homeItem = await _homeItemRepository.GetOwnedItemAsync(homeItemId, userId);
			if (homeItem == null)
				throw new ValidationException("Home item not found or you do not have permission.");
			homeItem.Name = input.Name;
			homeItem.Brand = input.Brand;
			homeItem.ModelNumber = input.ModelNumber;
			homeItem.Notes = input.Notes;
			homeItem.SerialNumber = input.SerialNumber;
			homeItem.Type = input.Type;
			homeItem.DateModified = DateTime.UtcNow;
			await _unitOfWork.SaveChangesAsync();
			return true;
		}
	}
}
