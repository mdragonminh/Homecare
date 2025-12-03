using HSP.Core.Constans;
using HSP.Core.Constants.SystemSettings;
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
using System.ComponentModel.DataAnnotations;
using System.Diagnostics;
using System.Net;

namespace HSP.Service.Implementations.Internal
{
    public class ServiceRequestService : BaseService, IServiceRequestService
    {
        private readonly IGeocodingService _geocodingService;
        private readonly IRepository<TechnicianProfile, Guid> _technicianRepository;
        private readonly IRepository<Booking, Guid> _bookingRepository;
        private readonly IRepository<BookingItem, Guid> _bookingItemRepository;
        private readonly IRepository<Core.Entities.Service, Guid> _serviceRepository;
        private readonly IEmailService _emailService;
        private readonly IEmailTemplateService _emailTemplateService;
        private readonly IUserRepository _userRepository;
        private readonly UrlSettingsDto _urlSettings;
        private readonly IRedisCacheService _redisCacheService;
        private readonly ISystemSettingService _systemSettingService;
        public ServiceRequestService(IGeocodingService geocodingService,
            IRepository<TechnicianProfile, Guid> technicianRepository,
            IRepository<Booking, Guid> bookingRepository,
            IRepository<BookingItem, Guid> bookingItemRepository,
            IRepository<Core.Entities.Service, Guid> serviceRepository,
            IEmailService emailService,
            IEmailTemplateService emailTemplateService,
            IUserRepository userRepository,
            IOptions<UrlSettingsDto> options,
            IRedisCacheService redisCacheService,
            ISystemSettingService systemSettingService,
            IUnitOfWork unitOfWork, IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
        {
            _geocodingService = geocodingService;
            _technicianRepository = technicianRepository;
            _bookingRepository = bookingRepository;
            _bookingItemRepository = bookingItemRepository;
            _serviceRepository = serviceRepository;
            _emailService = emailService;
            _emailTemplateService = emailTemplateService;
            _userRepository = userRepository;
            _urlSettings = options.Value;
            _redisCacheService = redisCacheService;
            _systemSettingService = systemSettingService;
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
            var desired = NormalizeToUtc(input.DesireDateTime);
            if (desired < DateTime.UtcNow)
                throw new ValidationException(_localizer["CannotSelectPastDate"]);
            var coordinates = !string.IsNullOrEmpty(input.Address)
                    ? await _geocodingService.GetCoordinatesForAddressAsync(input.Address)
                            ?? throw new Exception(_localizer["CannotFoundcoordinates."])
                    : throw new ArgumentException(_localizer["MustHaveAddress"]);
            var customer = await _userRepository.FindByIdAsync(Guid.Parse(input.CustomerId));
            if (customer == null)
            {
                throw new InvalidOperationException("customer is null");
            }
            Booking booking;
            using (var transaction = await _unitOfWork.BeginTransactionAsync())
            {
                booking = new Booking
                {
                    CustomerId = customer.Id,
                    Latitude = coordinates.Latitude,
                    Longitude = coordinates.Longitude,
                    DesiredDate = desired,
                    Status = BookingStatus.Pending,
                    DateCreated = DateTime.UtcNow
                };

                await _bookingRepository.AddAsync(booking);
                await _unitOfWork.SaveChangesAsync();

                var services = await _serviceRepository.GetAll()
                    .Where(s => input.ServiceIds.Contains(s.Id))
                    .ToListAsync();

                if (!services.Any())
                    throw new Exception("Không tìm thấy dịch vụ");

                var items = services.Select(s => new BookingItem
                {
                    BookingId = booking.Id,
                    ServiceId = s.Id,
                    Price = s.Price
                }).ToList();
                await _bookingItemRepository.AddRangeAsync(items);
                await _unitOfWork.SaveChangesAsync();
                await transaction.CommitAsync();
            }

            var technicians = await GetSortedTechniciansAsync(input.ServiceIds, coordinates);
            if (!technicians.Any())
                throw new InvalidOperationException(_localizer["NoAvailableTechniciansFound"]);
            var result = await NotifyTechniciansAndAwaitResponseAsync(booking, technicians, customer.FullName);
            return result;
        }
        private async Task<List<(TechnicianProfile Technician, double Distance, double Rating)>> GetSortedTechniciansAsync(IEnumerable<Guid> serviceIds, CoordinatesDto customerPos)
        {
            var searchRadiusKm = await _systemSettingService.GetValueAsync<int>(
                SystemSettingRegistry.Keys.TechnicianSearchRadiusKm);
            var (minLat, maxLat, minLon, maxLon) = GetBoundingBox(customerPos.Latitude, customerPos.Longitude, searchRadiusKm);
            var potential = await _technicianRepository.GetAll()
                .Include(t => t.User)
                .Include(t => t.Services)
                .Include(t => t.Bookings).ThenInclude(b => b.Feedbacks)
                .Where(t => t.ApprovalStatus == TechnicianApprovalStatus.Approved)
                 .Where(t => t.Latitude >= minLat && t.Latitude <= maxLat && t.Longitude >= minLon && t.Longitude <= maxLon)
                .Where(t => serviceIds.All(id => t.Services.Any(s => s.Id == id)))
                .Where(t => !t.Bookings.Any(b =>
                    b.Status == BookingStatus.InProgress ||
                    b.Status == BookingStatus.Pending ||
                    b.Status == BookingStatus.TechnicianOnTheWay ||
                    b.Status == BookingStatus.Confirmed))
                .ToListAsync();

            return potential
                .Select(t =>
                {
                    var distance = CalculateDistance(customerPos.Latitude, customerPos.Longitude, t.Latitude, t.Longitude);

                    var feedbacks = t.Bookings
                        .SelectMany(b => b.Feedbacks)
                        .Where(f => f.Source == FeedbackSource.Customer)
                        .ToList();

                    var rating = feedbacks.Any() ? feedbacks.Average(f => f.Rating) : 0;

                    return (t, distance, rating);
                })
                .Where(x => x.distance <= searchRadiusKm)
                .OrderBy(x => x.distance)
                .ThenByDescending(x => x.rating)
                .ToList();
        }

        private DateTime NormalizeToUtc(DateTime dt)
        {
            if (dt.Kind == DateTimeKind.Utc)
                return dt;

            if (dt.Kind == DateTimeKind.Local)
                return dt.ToUniversalTime();

            dt = DateTime.SpecifyKind(dt, DateTimeKind.Local);
            return dt.ToUniversalTime();
        }
        private async Task<MatchedBookingResultDto> NotifyTechniciansAndAwaitResponseAsync(
            Booking booking,
            List<(TechnicianProfile Technician, double Distance, double Rating)> sortedTechnicians,
            string customerName)
        {
            var responseTimeout = await _systemSettingService.GetValueAsync<int>(
                SystemSettingRegistry.Keys.TechnicianResponseTimeoutSeconds);

            var redisExpiration = await _systemSettingService.GetValueAsync<int>(
                SystemSettingRegistry.Keys.TechnicianInvitationExpirationSeconds);

            foreach (var tech in sortedTechnicians)
            {
                var rejectedBefore = await _redisCacheService.GetAsync<string>(
                    $"reject_{booking.Id}_{tech.Technician.Id}");

                if (rejectedBefore != null)
                    continue;

                string token = Guid.NewGuid().ToString("N");

                await _redisCacheService.SetAsync($"waiting_{token}", "waiting",
                    TimeSpan.FromSeconds(redisExpiration));

                await _redisCacheService.SetAsync($"accept_{token}", tech.Technician.Id,
                    TimeSpan.FromSeconds(redisExpiration));

                await SendInvitationEmailAsync(tech.Technician, customerName, booking, token);

                var stopwatch = Stopwatch.StartNew();

                while (stopwatch.Elapsed < TimeSpan.FromSeconds(responseTimeout))
                {
                    var rejected = await _redisCacheService.GetAsync<string>(
                        $"reject_{booking.Id}_{tech.Technician.Id}");

                    if (rejected != null)
                    {
                        await _redisCacheService.RemoveAsync($"waiting_{token}");
                        await _redisCacheService.RemoveAsync($"accept_{token}");
                        break;
                    }

                    var acceptedTechId = await _redisCacheService.GetAsync<Guid>($"accepted_{token}");

                    if (acceptedTechId != Guid.Empty)
                    {
                        booking.TechnicianId = acceptedTechId;
                        booking.Status = BookingStatus.Confirmed;
                        booking.DateModified = DateTime.UtcNow;
                        await _unitOfWork.SaveChangesAsync();

                        await _redisCacheService.RemoveAsync($"waiting_{token}");
                        await _redisCacheService.RemoveAsync($"accept_{token}");
                        await _redisCacheService.RemoveAsync($"accepted_{token}");

                        return new MatchedBookingResultDto
                        {
                            IsMatched = true,
                            Message = "Đã ghép kỹ thuật viên thành công",
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

                await _redisCacheService.RemoveAsync($"waiting_{token}");
                await _redisCacheService.RemoveAsync($"accept_{token}");
            }

            booking.Status = BookingStatus.Cancelled;
            booking.DateModified = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync();

            return new MatchedBookingResultDto
            {
                IsMatched = false,
                Message = "Không có kỹ thuật viên nào chấp nhận yêu cầu."
            };
        }

        private async Task SendInvitationEmailAsync(TechnicianProfile tech, string customerName, Booking booking, string token)
        {
            string encoded = WebUtility.UrlEncode(token);
            string detailUrl = $"{_urlSettings.Frontend}/technician/bookings/{booking.Id}?token={encoded}";

            var model = new TechnicianInvitationDto
            {
                TechnicianName = tech.User.FullName,
                CustomerName = customerName,
                BookingDetailUrl = detailUrl
            };

            string html = await _emailTemplateService.RenderAsync(
                "/Views/Emails/TechnicianInvitation.cshtml",
                model
            );

            await _emailService.SendEmailAsync(new EmailDto
            {
                ToEmail = tech.User.Email,
                Subject = "Bạn có yêu cầu dịch vụ mới",
                HtmlBody = html
            });
        }

        private (double minLat, double maxLat, double minLon, double maxLon) GetBoundingBox(double lat, double lon, double distanceKm)
        {
            const double latDegreesPerKm = 1 / GeoConstants.KmPerDegreeLatitude;
            var lonDegreesPerKm = 1 / (GeoConstants.KmPerDegreeLatitude * Math.Cos(lat * GeoConstants.DegreeToRadian));

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
            var searchRadiusKm = await _systemSettingService.GetValueAsync<int>(SystemSettingRegistry.Keys.TechnicianSearchRadiusKm);
            var allTechnicians = await _technicianRepository.GetAll()
                .Include(x => x.User)
                .Include(x => x.Bookings)
                    .ThenInclude(b => b.Feedbacks)
                .Where(x => x.ApprovalStatus == TechnicianApprovalStatus.Approved)
                .WhereIf(input.ServiceIds != null && input.ServiceIds.Any(), t => t.Services.Any(s => input.ServiceIds.Contains(s.Id)))
                .Where(x => !x.Bookings.Any(b =>
                    b.Status == BookingStatus.InProgress
                    || b.Status == BookingStatus.Pending
                    || b.Status == BookingStatus.TechnicianOnTheWay
                    || b.Status == BookingStatus.Confirmed))
                .ToListAsync();

            var filtered = allTechnicians
                             .Select(t =>
                             {
                                 var feedbacks = t.Bookings
                                     .SelectMany(b => b.Feedbacks)
                                     .Where(f => f.Source == FeedbackSource.Customer)
                                     .ToList();

                                 var rating = feedbacks.Any()
                                     ? feedbacks.Average(f => f.Rating)
                                     : 0;

                                 return (
                                     Technician: t,
                                     Distance: CalculateDistance(
                                         coordinates.Latitude,
                                         coordinates.Longitude,
                                         t.Latitude,
                                         t.Longitude
                                     ),
                                     Rating: rating
                                 );
                             })
                             .Where(x => x.Distance <= searchRadiusKm)
                             .OrderBy(x => x.Distance)
                              .ThenByDescending(x => x.Rating)
                             .Select(x =>
                             {
                                 var customerFeedbacks = x.Technician.Bookings
                                     .SelectMany(b => b.Feedbacks)
                                     .Where(f => f.Source == FeedbackSource.Customer)
                                     .ToList();

                                 return new TechnicianResultDto
                                 {
                                     Id = x.Technician.Id,
                                     Name = x.Technician.User.FullName,
                                     Rating = customerFeedbacks.Any()
                                         ? Math.Round(customerFeedbacks.Average(f => f.Rating), 1)
                                         : 0,
                                     RatingCount = customerFeedbacks.Count,
                                     DistanceKm = Math.Round(x.Distance, 2),
                                     Latitude = x.Technician.Latitude,
                                     Longitude = x.Technician.Longitude
                                 };
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
