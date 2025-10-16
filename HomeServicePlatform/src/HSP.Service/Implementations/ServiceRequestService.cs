using HSP.Core.Constans;
using HSP.Core.Dtos.BookingDto;
using HSP.Core.Dtos.MapDto;
using HSP.Core.Dtos.ServiceRequestDto;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.DAL.Extensions;
using HSP.DAL.UnitOfWorks;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace HSP.Service.Implementations
{
	public class ServiceRequestService : BaseService, IServiceRequestService
	{
		private readonly IGeocodingService _geocodingService;
		private readonly IRepository<TechnicianProfile, Guid> _technicianRepository;
		private readonly IRepository<Booking, Guid> _bookingRepository;
		public ServiceRequestService(IGeocodingService geocodingService,
			IRepository<TechnicianProfile, Guid> technicianRepository,
			IRepository<Booking, Guid> bookingRepository,
			IUnitOfWork unitOfWork, IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
		{
			_geocodingService = geocodingService;
			_technicianRepository = technicianRepository;
			_bookingRepository = bookingRepository;
		}

		public async Task<MatchedBookingResultDto> CreateAndMatchBookingAsync(CustomerCreateBookingDto input)
		{
			var coordinates = !string.IsNullOrEmpty(input.Address)
					? await _geocodingService.GetCoordinatesForAddressAsync(input.Address)
							?? throw new Exception(_localizer["CannotFoundcoordinates."])
					: throw new ArgumentException(_localizer["MustHaveAddress"]);

			var (minLat, maxLat, minLon, maxLon) = GetBoundingBox(coordinates.Latitude, coordinates.Longitude, input.DistanceKm);

			var potentialTechniciansQuery = _technicianRepository.GetAll()
					.Include(t => t.User)
					.Include(t => t.Services)
						.ThenInclude(s => s.Bookings)
					.Where(t => t.Latitude >= minLat && t.Latitude <= maxLat && t.Longitude >= minLon && t.Longitude <= maxLon)
					.Where(t => t.ApprovalStatus == TechnicianApprovalStatus.Approved)
					.WhereIf(input.ServiceIds != null && input.ServiceIds.Any(), t => t.Services.Any(s => input.ServiceIds.Contains(s.Id)))
					.Where(t => !t.Bookings.Any(b => 
					b.Status == BookingStatus.InProgress 
					|| b.Status == BookingStatus.Pending 
					|| b.Status == BookingStatus.TechnicianOnTheWay 
					|| b.Status == BookingStatus.Confirmed));

			var potentialTechnicians = await potentialTechniciansQuery.ToListAsync();

			var bestTechnician = potentialTechnicians
					.Select(t => new {
						Technician = t,
						Distance = CalculateDistance(coordinates.Latitude, coordinates.Longitude, t.Latitude, t.Longitude)
					})
					.Where(t => t.Distance <= input.DistanceKm) 
					.OrderBy(t => t.Distance) 
					// .ThenByDescending(t => t.Technician.Rating) 
					.FirstOrDefault();

			if (bestTechnician == null)
			{
				return new MatchedBookingResultDto { IsMatched = false, Message = _localizer["NoAvailableTechniciansFound"] };
			}

			var newBooking = new Booking
			{
				CustomerProfileId = input.CustomerId,
				TechnicianId = bestTechnician.Technician.Id,
				Status = BookingStatus.Pending,
				//ProblemDescription = input.Description,
				ServiceId = input.ServiceIds.First()
			};

			await _bookingRepository.AddAsync(newBooking);
			await _unitOfWork.SaveChangesAsync();

			return new MatchedBookingResultDto
			{
				IsMatched = true,
				BookingId = newBooking.Id,
				Message = _localizer["SuccessfullyMatchedTechnician"],
				TechnicianInfo = new TechnicianResultDto
				{
					Id = bestTechnician.Technician.Id,
					Name = bestTechnician.Technician.User.FullName,
					DistanceKm = Math.Round(bestTechnician.Distance, 2),
					Latitude = bestTechnician.Technician.Latitude,
					Longitude = bestTechnician.Technician.Longitude,
					// Rating = bestTechnician.Technician.Rating
				}
			};
		}

		private (double minLat, double maxLat, double minLon, double maxLon) GetBoundingBox(double lat, double lon, double distanceKm)
		{
			const double latDegreesPerKm = 1 / 111.0;
			var lonDegreesPerKm = 1 / (111.0 * Math.Cos(lat * GeoConstants.DegreeToRadian));

			var latDelta = distanceKm * latDegreesPerKm;
			var lonDelta = distanceKm * lonDegreesPerKm;

			return (lat - latDelta, lat + latDelta, lon - lonDelta, lon + lonDelta);
		}

		public async Task<IEnumerable<TechnicianResultDto>> SearchNearbyTechniciansAsync(SearchTechnicianInput input)
		{
			CoordinatesDto coordinates = !string.IsNullOrEmpty(input.Address)
			? await _geocodingService.GetCoordinatesForAddressAsync(input.Address)
					?? throw new Exception(_localizer["CannotFoundcoordinates."])
			: throw new ArgumentException(_localizer["MustHaveAddress"]);

			var allTechnicians = await _technicianRepository.GetAll()
				.Include(x => x.User)
				.Where(x => x.ApprovalStatus == TechnicianApprovalStatus.Approved)
				.WhereIf(input.ServiceIds != null && input.ServiceIds.Any(), x => x.Services.Any(s => input.ServiceIds.Contains(s.Id)))
				.ToListAsync();
			var filtered = allTechnicians
							 .Select(t => new
							 {
								 Technician = t,
								 Distance = CalculateDistance(coordinates.Latitude, coordinates.Longitude, t.Latitude, t.Longitude)
							 })
							 .Where(x => x.Distance <= input.MaxDistanceKm)
							 .OrderBy(x => x.Distance)
							 .Select(x => new TechnicianResultDto
							 {
								 Id = x.Technician.Id,
								 Name = x.Technician.User.FullName,
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
