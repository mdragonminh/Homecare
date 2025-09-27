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

		public async Task<Guid> CreateHomeAsync(CreateHomeDto input)
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
				CustomerProfileId = input.CustomerProfileId,
			};
			await _homeRepository.AddAsync(newHome);
			await _unitOfWork.SaveChangesAsync();
			return newHome.Id;
		}

		public async Task<PagedList<HomeDto>> GetAllHomesAsync(HomeInput input, string userId)
		{
			var customerProfileId = await _customerProfileRepository.GetAll()
				.FirstOrDefaultAsync(x => x.UserId.ToString().Equals(userId));
			if (customerProfileId == null)
			{
				throw new ValidationException("Customer profile not found for the user.");
			}
			var query = _homeRepository.GetAll()
			.WhereIf(!string.IsNullOrEmpty(input.Search), x => x.Name.ToLower().Contains(input.Search.ToLower()))
			.Where(x=>x.CustomerProfileId.Equals(customerProfileId.Id));
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
	}
}
