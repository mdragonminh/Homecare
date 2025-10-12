using HSP.Core.Constans;
using HSP.Core.Dtos.MapDto;
using HSP.Core.Dtos.ServiceRequestDto;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.DAL.Extensions;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace HSP.Service.Implementations
{
	public class ServiceRequestService : BaseService, IServiceRequestService
	{
		private readonly IGeocodingService _geocodingService;
		private readonly IRepository<TechnicianProfile, Guid> _technicianRepository;
		public ServiceRequestService(IGeocodingService geocodingService,
			IRepository<TechnicianProfile, Guid> technicianRepository,
			IUnitOfWork unitOfWork, IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
		{
			_geocodingService = geocodingService;
			_technicianRepository = technicianRepository;
		}

		public async Task<IEnumerable<TechnicianResultDto>> SearchNearbyTechniciansAsync(SearchTechnicianInput input)
		{
			CoordinatesDto coordinates;

			if (!string.IsNullOrEmpty(input.Address))
			{
				coordinates = await _geocodingService.GetCoordinatesForAddressAsync(input.Address)
						?? throw new Exception(_localizer["CannotFoundcoordinates."]);
			}
			else if (input.Lat.HasValue && input.Lng.HasValue)
			{
				coordinates = new CoordinatesDto
				{
					Latitude = input.Lat.Value,
					Longitude = input.Lng.Value
				};
			}
			else
			{
				throw new ArgumentException(_localizer["MustHaveAddressOr(Lat/Lng)."]);
			}
			var allTechnicians = await _technicianRepository.GetAll()
				.Include(x => x.User)
				.Include(x=>x.Services)
				.Where(x=>x.ApprovalStatus == TechnicianApprovalStatus.Approved)
				.ToListAsync();
			var filtered = allTechnicians
							 .Select(t => new
							 {
								 Technician = t,
								 MinPrice = t.Services.Any() ? t.Services.Min(s => s.BasePrice) : 0,
								 MaxPrice = t.Services.Any() ? t.Services.Max(s => s.BasePrice) : 0,
								 Distance = CalculateDistance(coordinates.Latitude, coordinates.Longitude, t.Latitude, t.Longitude)
							 })
							 .Where(x => !input.MinPrice.HasValue || x.MinPrice >= input.MinPrice)
								.Where(x => !input.MaxPrice.HasValue || x.MaxPrice <= input.MaxPrice)
							 .Where(x => x.Distance <= input.MaxDistanceKm)
							 .OrderBy(x => x.Distance)
							 .ThenBy(x => x.MinPrice)
							 .Select(x => new TechnicianResultDto
							 {
								 Id = x.Technician.Id,
								 Name = x.Technician.User.FullName,
								 MinPrice = x.MinPrice,
								 MaxPrice = x.MaxPrice,
								 //Rating = x.Technician.Rating,
								 DistanceKm = Math.Round(x.Distance, 2),
								 Latitude = x.Technician.Latitude,
								 Longitude = x.Technician.Longitude
							 })
							 .ToList();

			return filtered;
		}
		private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
		{
			var dLat = (lat2 - lat1) * GeoConstants.DegreeToRadian;
			var dLon = (lon2 - lon1) * GeoConstants.DegreeToRadian;

			var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
							Math.Cos(lat1 * GeoConstants.DegreeToRadian) * Math.Cos(lat2 * GeoConstants.DegreeToRadian) *
							Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

			var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
			return GeoConstants.EarthRadiusKm * c;
		}
	}
}
