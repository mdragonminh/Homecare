using HSP.Core.Constans;
using HSP.Core.Dtos.ConfigurationDto;
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
using Microsoft.Extensions.Options;
using System.Diagnostics;
using System.Net;

namespace HSP.Service.Implementations
{
	public class ServiceRequestService : BaseService, IServiceRequestService
	{
		private readonly IGeocodingService _geocodingService;
		private readonly IRepository<TechnicianProfile, Guid> _technicianRepository;
		private readonly IEmailService _emailService;
		private readonly IEmailTemplateService _emailTemplateService;
		private readonly IUserRepository _userRepository;
		private readonly UrlSettingsDto _urlSettings;
		private readonly IRedisCacheService _redisCacheService;
		public ServiceRequestService(IGeocodingService geocodingService,
			IRepository<TechnicianProfile, Guid> technicianRepository,
			IEmailService emailService,
			IEmailTemplateService emailTemplateService,
			IUserRepository userRepository,
			IOptions<UrlSettingsDto> options,
			IRedisCacheService redisCacheService,
			IUnitOfWork unitOfWork, IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
		{
			_geocodingService = geocodingService;
			_technicianRepository = technicianRepository;
			_emailService = emailService;
			_emailTemplateService = emailTemplateService;
			_userRepository = userRepository;
			_urlSettings = options.Value;
			_redisCacheService = redisCacheService;
		}

		private async Task<Guid?> GetAcceptedTechnicianAsync(string token)
		{
			var techId = await _redisCacheService.GetAsync<Guid>($"accepted_{token}");
			if (techId != Guid.Empty)
			{
				await _redisCacheService.RemoveAsync($"accepted_{token}");
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
			var customer = await _userRepository.FindByIdAsync(Guid.Parse(input.CustomerId));
			if (customer == null)
			{
				throw new Exception("customer is null");
			}
			var (minLat, maxLat, minLon, maxLon) = GetBoundingBox(coordinates.Latitude, coordinates.Longitude, input.DistanceKm);
			var potentialTechnicians = await _technicianRepository.GetAll()
					.Include(t => t.User)
					.Include(t => t.Services)
					.Include(t => t.Bookings)
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
				.Select(t => (

					Technician: t,
					Distance: CalculateDistance(coordinates.Latitude, coordinates.Longitude, t.Latitude, t.Longitude)
				))
				.Where(t => t.Distance <= input.DistanceKm)
				.OrderBy(t => t.Distance)
				.ToList();
			if (!sorted.Any())
			{
				throw new Exception(_localizer["NoAvailableTechniciansFound"]);
			}

			var matchResult = await NotifyTechniciansAndAwaitResponseAsync(sorted, customer, input);
			return matchResult;
		}

		private async Task<MatchedBookingResultDto> NotifyTechniciansAndAwaitResponseAsync(
			List<(TechnicianProfile Technician, double Distance)> sortedTechnicians,
			AppUser customer,
			CustomerCreateBookingDto input)
		{
			foreach (var tech in sortedTechnicians)
			{
				var token = Guid.NewGuid().ToString("N");
				await _redisCacheService.SetAsync($"waiting_{token}", "waiting", TimeSpan.FromSeconds(15));
				await _redisCacheService.SetAsync($"accept_{token}", tech.Technician.Id, TimeSpan.FromSeconds(15));
				await SendInvitationEmailAsync(tech, customer, input, token);

				var stopwatch = Stopwatch.StartNew();
				while (stopwatch.Elapsed < TimeSpan.FromSeconds(10))
				{
					var acceptedTechId = await GetAcceptedTechnicianAsync(token);
					if (acceptedTechId.HasValue)
					{
						return new MatchedBookingResultDto
						{
							IsMatched = true,
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

		private async Task SendInvitationEmailAsync(
			(TechnicianProfile Technician, double Distance) tech,
			AppUser customer,
			CustomerCreateBookingDto input,
			string token)
		{
			string encodedToken = WebUtility.UrlEncode(token);
			string baseUrl = _urlSettings.BaseUrl;
			string acceptUrl = $"{baseUrl}/api/booking/accept" +
													 $"?customerId={customer.Id}" +
													 $"&technicianId={tech.Technician.Id}" +
													 $"&token={encodedToken}" +
													 $"&serviceId={input.ServiceIds}" +
													 $"&desiredDate={input.DesireDateTime:o}";
			string declineUrl = $"{baseUrl}/api/booking/cancel" +
															$"?technicianId={tech.Technician.Id}&token={token}";
			var emailModel = new TechnicianInvitationDto
			{
				TechnicianName = tech.Technician.User.FullName,
				CustomerName = customer.FullName,
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
				Subject = $"Yêu cầu dịch vụ mới gần bạn lúc {DateTime.Now:HH:mm:ss}",
				HtmlBody = htmlBody
			};
			await _emailService.SendEmailAsync(email);
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
				.Include(x => x.Bookings)
				.Where(x => x.ApprovalStatus == TechnicianApprovalStatus.Approved)
				.WhereIf(input.ServiceIds != null && input.ServiceIds.Any(), x => x.Services.Any(s => input.ServiceIds.Contains(s.Id)))
				.Where(x => !x.Bookings.Any(b =>
					b.Status == BookingStatus.InProgress
					|| b.Status == BookingStatus.Pending
					|| b.Status == BookingStatus.TechnicianOnTheWay
					|| b.Status == BookingStatus.Confirmed))
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
