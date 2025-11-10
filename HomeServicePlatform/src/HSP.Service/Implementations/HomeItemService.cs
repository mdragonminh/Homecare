using HSP.Core.Dtos.HomeItemDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.DAL.Extensions;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using System.ComponentModel.DataAnnotations;

namespace HSP.Service.Implementations
{
	public class HomeItemService : BaseService, IHomeItemService
	{
		private readonly IRepository<HomeItem, Guid> _homeItemRepository;
		private readonly IRepository<Home, Guid> _homeRepository;
		public HomeItemService(IRepository<HomeItem, Guid> homeItemRepository,
			IRepository<Home, Guid> homeRepository,
		IUnitOfWork unitOfWork, IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
		{
			_homeItemRepository = homeItemRepository;
			_homeRepository = homeRepository;
		}

		public async Task<Guid> CreateHomeItemAsync(CreateHomeItemDto input, Guid userId)
		{
			if (input == null)
			{
				throw new ArgumentException("input parameter can not be null");
			}
			await VerifyHomeOwnershipAsync(input.HomeId, userId);
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
		public async Task<bool> DeleteHomeItemAsync(Guid homeItemId, Guid userId)
		{
			var itemToDelete = await GetOwnedHomeItemAsync(homeItemId, userId);
			await _homeItemRepository.DeleteAsync(homeItemId);
			await _unitOfWork.SaveChangesAsync();
			return true;
		}
		public async Task<PagedList<HomeItemDto>> GetAllHomeItemsAsync(HomeItemInput input, Guid homeId, Guid userId)
		{
			var query = _homeItemRepository.GetAll()
				.WhereIf(!string.IsNullOrEmpty(input.Search), x => x.Name.ToLower().Contains(input.Search.ToLower()))
				.Where(x => x.HomeId == homeId && x.Home.CustomerProfile.Id.Equals(userId));

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
		public async Task<HomeItemDto> GetHomeItemByIdAsync(Guid homeItemId, Guid userId)
		{
			var homeItem = await GetOwnedHomeItemAsync(homeItemId, userId);
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
		public async Task<bool> UpdateHomeItemAsync(Guid homeItemId, UpdateHomeItemDto input, Guid userId)
		{
			var homeItem = await GetOwnedHomeItemAsync(homeItemId, userId);
			var flag = false;
			if(input.Name != homeItem.Name)
			{
				homeItem.Name = input.Name;
				flag = true;
			}
			if(input.Brand != homeItem.Brand)
			{
				homeItem.Brand = input.Brand;
				flag = true;
			}
			if(input.ModelNumber != homeItem.ModelNumber)
			{
				homeItem.ModelNumber = input.ModelNumber;
				flag = true;
			}
			if(input.Notes != homeItem.Notes)
			{
				homeItem.Notes = input.Notes;
				flag = true;
			}
			if(input.SerialNumber != homeItem.SerialNumber)
			{
				homeItem.SerialNumber = input.SerialNumber;
				flag = true;
			}
			if (input.Type != homeItem.Type)
			{
				homeItem.Type = input.Type;
				flag = true;
			}
			if (flag == true)
			{
				homeItem.DateModified = DateTime.UtcNow;
				await _unitOfWork.SaveChangesAsync();
			}
			return true;
		}
		private async Task VerifyHomeOwnershipAsync(Guid homeId, Guid userId)
		{
			var isOwner = await _homeRepository.GetAll()
					.Include(h => h.CustomerProfile)
					.AnyAsync(h => h.Id == homeId && h.CustomerProfile.Id.Equals(userId));
			if (!isOwner)
			{
				throw new UnauthorizedAccessException("User does not have access to these home items.");
			}
		}
		private async Task<HomeItem> GetOwnedHomeItemAsync(Guid itemId, Guid userId)
		{
			var homeItem = await _homeItemRepository.GetAll()
					.Include(x => x.Home)
					.ThenInclude(h => h.CustomerProfile)
					.FirstOrDefaultAsync(i => i.Id == itemId && i.Home.CustomerProfile.Id.Equals(userId));

			if (homeItem == null)
			{
				throw new ValidationException("Home item not found or you do not have permission to delete this home item.");
			}

			return homeItem;
		}
	}
}
