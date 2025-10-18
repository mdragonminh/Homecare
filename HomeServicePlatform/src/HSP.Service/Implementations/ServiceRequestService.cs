using HSP.Core.Constans;
using HSP.Core.Dtos.MapDto;
using HSP.Core.Dtos.ServiceRequestDto;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.DAL.Extensions;
using HSP.Service.Dtos.EmailDto;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Globalization;

namespace HSP.Service.Implementations
{
	public class ServiceRequestService : BaseService, IServiceRequestService
	{
		private readonly IGeocodingService _geocodingService;
		private readonly IRepository<TechnicianProfile, Guid> _technicianRepository;
		private readonly IRepository<Booking, Guid> _bookingRepository;
		private readonly IRepository<CustomerProfile, Guid> _customerProfileRepository;
		private readonly IEmailService _emailService;
		private readonly IEmailTemplateService _emailTemplateService;
		private static readonly ConcurrentDictionary<string, Guid> _acceptedRequests = new();
		public ServiceRequestService(IGeocodingService geocodingService,
			IRepository<TechnicianProfile, Guid> technicianRepository,
			IRepository<Booking, Guid> bookingRepository,
			IRepository<CustomerProfile, Guid> customerProfileRepository,
			IEmailService emailService,
			IEmailTemplateService emailTemplateService,
			IUnitOfWork unitOfWork, IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
		{
			_geocodingService = geocodingService;
			_technicianRepository = technicianRepository;
			_bookingRepository = bookingRepository;
			_customerProfileRepository = customerProfileRepository;
			_emailService = emailService;
			_emailTemplateService = emailTemplateService;
		}
		public static void AcceptBookingResponse(string token, Guid technicianId)
		{
			_acceptedRequests[token] = technicianId;
		}

		private static Guid? GetAcceptedTechnician(string token)
		{
			if (_acceptedRequests.TryGetValue(token, out var techId))
			{
				_acceptedRequests.TryRemove(token, out _);
				return techId;
			}
			return null;
		}

		public async Task<MatchedBookingResultDto> CreateAndMatchBookingAsync(CustomerCreateBookingDto input)
		{
			if (input == null)
				throw new ArgumentNullException(nameof(input));

			var coordinates = !string.IsNullOrEmpty(input.Address)
					? await _geocodingService.GetCoordinatesForAddressAsync(input.Address)
							?? throw new Exception(_localizer["CannotFoundcoordinates."])
					: throw new ArgumentException(_localizer["MustHaveAddress"]);
			var customer = await _customerProfileRepository.GetAll()
				.Include(x => x.User)
				.FirstOrDefaultAsync(x => x.UserId == Guid.Parse(input.CustomerId));
			if (customer == null)
			{
				throw new Exception("customer is null");
			}

			var (minLat, maxLat, minLon, maxLon) = GetBoundingBox(coordinates.Latitude, coordinates.Longitude, input.DistanceKm);

			var potentialTechnicians = await _technicianRepository.GetAll()
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
					|| b.Status == BookingStatus.Confirmed))
					.ToListAsync();

			var sorted = potentialTechnicians
				.Select(t => new
				{
					Technician = t,
					Distance = CalculateDistance(coordinates.Latitude, coordinates.Longitude, t.Latitude, t.Longitude)
				})
				.Where(t => t.Distance <= input.DistanceKm)
				.OrderBy(t => t.Distance)
				.ToList();

			if (!sorted.Any())
			{
				throw new Exception(_localizer["NoAvailableTechniciansFound"]);
			}
			_acceptedRequests.Clear();
			foreach (var tech in sorted)
			{
				string token = Guid.NewGuid().ToString("N");
				string acceptUrl = $"https://localhost:7190/api/booking/accept?customerId={customer.Id}&technicianId={tech.Technician.Id}&token={token}&serviceId={input.ServiceIds.First()}&desiredDate={input.DesireDateTime:o}";
				string declineUrl = $"https://localhost:7190/api/booking/cancel?technicianId={tech.Technician.Id}&token={token}";

				var emailModel = new TechnicianInvitationDto
				{
					TechnicianName = tech.Technician.User.FullName,
					CustomerName = customer.User.FullName,
					ServiceName = "Dịch vụ yêu cầu",
					DistanceKm = Math.Round(tech.Distance, 2),
					AcceptUrl = acceptUrl,
					DeclineUrl = declineUrl,
					DesiredDate = input.DesireDateTime
				};

				string htmlBody = await _emailTemplateService.RenderAsync("/Views/Emails/TechnicianInvitation.cshtml", emailModel);

				var email = new EmailDto
				{
					ToEmail = tech.Technician.User.Email,
					Subject = "Yêu cầu dịch vụ mới gần bạn",
					HtmlBody = htmlBody
				};
				await _emailService.SendEmailAsync(email);
				var stopwatch = Stopwatch.StartNew();
				while (stopwatch.Elapsed < TimeSpan.FromSeconds(10))
				{
					var acceptedTechId = GetAcceptedTechnician(token);
					if (acceptedTechId.HasValue)
					{
						var newBooking = new Booking
						{
							CustomerProfileId = customer.Id,
							TechnicianId = acceptedTechId.Value,
							Status = BookingStatus.Confirmed,
							ServiceId = input.ServiceIds.First(),
							DateCreated = DateTime.UtcNow,
							DesiredDate = input.DesireDateTime
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
								Id = tech.Technician.Id,
								Name = tech.Technician.User.FullName,
								DistanceKm = Math.Round(tech.Distance, 2),
								Latitude = tech.Technician.Latitude,
								Longitude = tech.Technician.Longitude
							}
						};
					}
					await Task.Delay(1000);
				}
			}
			return new MatchedBookingResultDto
			{
				IsMatched = false,
				Message = _localizer["NoTechnicianAcceptedRequest"]
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
