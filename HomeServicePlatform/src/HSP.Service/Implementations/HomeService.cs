using HSP.Core.Dtos.HomeDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Interfaces;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.DAL.Extensions;
using HSP.Service.Dtos.HomeDto;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using System.ComponentModel.DataAnnotations;

namespace HSP.Service.Implementations
{
	public class HomeService : BaseService, IHomeService
	{
		private readonly IRepository<Home, Guid> _homeRepository;
		private readonly IGeocodingService _geocodingService;
		public HomeService(IGeocodingService geocodingService, IRepository<Home, Guid> homeRepository,
			IUnitOfWork unitOfWork, IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
		{
			_geocodingService = geocodingService;
			_homeRepository = homeRepository;
		}

		public async Task<Guid> CreateHomeAsync(CreateHomeDto input, Guid customerProfileId)
		{
			if (input == null)
			{
				throw new ArgumentException("input parameter can not be null");
			}
			var coordinates = await _geocodingService.GetCoordinatesForAddressAsync(input.Address);
			if (coordinates == null)
			{
				throw new ValidationException("Could not find coordinates for the provided address.");
			}
			var newHome = new Home
			{
				Address = input.Address,
				Name = input.Name,
				Latitude = coordinates.Latitude,
				Longitude = coordinates.Longitude,
				CustomerId = customerProfileId,
				DateCreated = DateTime.UtcNow
			};
			await _homeRepository.AddAsync(newHome);
			await _unitOfWork.SaveChangesAsync();
			return newHome.Id;
		}

		public async Task<bool> DeleteHomeAsynce(Guid homeId, string userId)
		{
			var home = await _homeRepository.GetAll()
				.Include(x => x.CustomerProfile)
				.FirstOrDefaultAsync(x => x.Id.Equals(homeId) && x.CustomerProfile.Id.ToString().Equals(userId));
			if (home == null)
			{
				throw new ValidationException("Home not found or you do not have permission to delete this home.");
			}
			await _homeRepository.DeleteAsync(home.Id);
			await _unitOfWork.SaveChangesAsync();
			return true;
		}

		public async Task<PagedList<HomeDto>> GetAllHomesAsync(HomeInput input, string userId)
		{
			var query = _homeRepository.GetAll()
				.Include(x => x.CustomerProfile)
			.WhereIf(!string.IsNullOrEmpty(input.Search), x => x.Name.ToLower().Contains(input.Search.ToLower()))
			.Where(x=>x.CustomerProfile.Id.ToString().Equals(userId));
			var homeDtos = query.Select(x => new HomeDto
			{
				Id = x.Id,
				Name = x.Name,
				Address = x.Address,
				Latitude = x.Latitude,
				Longitude = x.Longitude,
				CustomerProfileId = x.CustomerId,
			});
			var pagedHomes = await homeDtos.ToPagedListAsync(input);
			return pagedHomes;
		}

		public async Task<HomeDto> GetHomeByIdAsync(Guid homeId, string userId)
		{
			var query = await _homeRepository.GetAll()
				.Include(x => x.CustomerProfile)
				.FirstOrDefaultAsync(x => x.Id.Equals(homeId) && x.CustomerProfile.Id.ToString().Equals(userId));
			if (query == null)
			{
				throw new ValidationException("Home not found or you do not have permission to view this home.");
			}
			var homeDto = new HomeDto
			{
				Id = query.Id,
				Name = query.Name,
				Address = query.Address,
				Latitude = query.Latitude,
				Longitude = query.Longitude,
				CustomerProfileId = query.CustomerId,
			};
			return homeDto;
		}

		public async Task<bool> UpdateHomeAsync(Guid homeId, UpdateHomeDto input, string userId)
		{
			if (input == null)
			{
				throw new ArgumentException("input parameter can not be null");
			}
			var homeToUpdate = await _homeRepository.GetAll()
				.Include(x=>x.CustomerProfile)
				.FirstOrDefaultAsync(x=> x.Id.Equals(homeId) && x.CustomerProfile.Id.ToString().Equals(userId));
			if (homeToUpdate == null)
			{
				throw new ValidationException("Home not found or you do not have permission to delete this home.");
			}
			homeToUpdate.Name = input.Name;
			if(homeToUpdate.Address != input.Address)
			{
				var coordinates = await _geocodingService.GetCoordinatesForAddressAsync(input.Address);
				if (coordinates == null)
				{
					throw new ValidationException("Could not find coordinates for the provided address.");
				}
				homeToUpdate.Address = input.Address;
				homeToUpdate.Latitude = coordinates.Latitude;
				homeToUpdate.Longitude = coordinates.Longitude;
			}
			homeToUpdate.DateModified = DateTime.UtcNow;
			await _unitOfWork.SaveChangesAsync();
			return true;
		}
	}
}
