using HSP.Core.Entities;
using HSP.Core.Interfaces;
using HSP.Service.Dtos.HomeDto;
using HSP.Service.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace HSP.Service.Implementations
{
	public class HomeService : BaseService,IHomeService
	{
		private readonly IRepository<Home, Guid> _homeRepository;
		private readonly IGeocodingService _geocodingService;
		public HomeService(IGeocodingService geocodingService,IRepository<Home, Guid> homeRepository, IUnitOfWork unitOfWork) : base(unitOfWork)
		{
			_geocodingService = geocodingService;
			_homeRepository = homeRepository;
		}

		public async Task<Guid> CreateHomeAsync(CreateHomeDto input)
		{
			if(input == null)
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
	}
}
