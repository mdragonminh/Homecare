using HSP.Core.Dtos.HomeDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Interfaces;
using HSP.DAL.Extensions;
using HSP.Service.Dtos.HomeDto;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace HSP.Service.Implementations
{
	public class HomeService : BaseService, IHomeService
	{
		private readonly IRepository<Home, Guid> _homeRepository;
		private readonly IRepository<CustomerProfile, Guid> _customerProfileRepository;
		private readonly IGeocodingService _geocodingService;
		public HomeService(IGeocodingService geocodingService, IRepository<Home, Guid> homeRepository,
			IRepository<CustomerProfile, Guid> customerProfileRepository,
			IUnitOfWork unitOfWork) : base(unitOfWork)
		{
			_geocodingService = geocodingService;
			_homeRepository = homeRepository;
			_customerProfileRepository = customerProfileRepository;
		}

		public async Task<Guid> CreateHomeAsync(CreateHomeDto input, string userId)
		{
			if (input == null)
			{
				throw new ArgumentException("input parameter can not be null");
			}
			var customerProfileId = await GetCustomerProfileIdByUserId(userId);
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
				CustomerProfileId = customerProfileId,
				DateCreated = DateTime.UtcNow
			};
			await _homeRepository.AddAsync(newHome);
			await _unitOfWork.SaveChangesAsync();
			return newHome.Id;
		}

		public async Task<bool> DeleteHomeAsynce(Guid homeId, string userId)
		{
			var customerProfile = await GetCustomerProfileIdByUserId(userId);
			var home = await _homeRepository.GetByIdAsync(homeId);
			if (home == null || !home.CustomerProfileId.Equals(customerProfile))
			{
				throw new ValidationException("Home not found or you do not have permission to delete this home.");
			}
			await _homeRepository.DeleteAsync(homeId);
			await _unitOfWork.SaveChangesAsync();
			return true;
		}

		public async Task<PagedList<HomeDto>> GetAllHomesAsync(HomeInput input, string userId)
		{
			var customerProfileId = await GetCustomerProfileIdByUserId(userId);
			var query = _homeRepository.GetAll()
			.WhereIf(!string.IsNullOrEmpty(input.Search), x => x.Name.ToLower().Contains(input.Search.ToLower()))
			.Where(x=>x.CustomerProfileId.Equals(customerProfileId));
			var homeDtos = query.Select(x => new HomeDto
			{
				Id = x.Id,
				Name = x.Name,
				Address = x.Address,
				Latitude = x.Latitude,
				Longitude = x.Longitude,
				CustomerProfileId = x.CustomerProfileId,
			});
			var pagedHomes = await homeDtos.ToPagedListAsync(input);
			return pagedHomes;
		}

		public async Task<HomeDto> GetHomeByIdAsync(Guid homeId, string userId)
		{
			var customerProfileId = GetCustomerProfileIdByUserId(userId);
			var query = await _homeRepository.GetByIdAsync(homeId);
			if (query == null || !query.CustomerProfileId.Equals(customerProfileId))
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
				CustomerProfileId = query.CustomerProfileId,
			};
			return homeDto;
		}

		public async Task<bool> UpdateHomeAsync(Guid homeId, UpdateHomeDto input, string userId)
		{
			if (input == null)
			{
				throw new ArgumentException("input parameter can not be null");
			}
			var homeToUpdate = await _homeRepository.GetByIdAsync(homeId);
			if (homeToUpdate == null)
			{
				throw new ValidationException("Home not found.");
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

		private async Task<Guid> GetCustomerProfileIdByUserId(string userId)
		{
			var customerProfile = await _customerProfileRepository.GetAll()
				.FirstOrDefaultAsync(x => x.UserId.ToString().Equals(userId));
			if (customerProfile == null)
			{
				throw new ValidationException("Customer profile not found for the user.");
			}
			return customerProfile.Id;
		}
	}
}
