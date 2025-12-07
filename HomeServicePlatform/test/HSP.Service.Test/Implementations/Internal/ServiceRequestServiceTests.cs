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
using HSP.Service.Dtos.EmailDto;
using HSP.Service.Implementations.Internal;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Xunit;

namespace HSP.Service.Test.Implementations.Internal
{
    public class ServiceRequestServiceTests
    {
        // Mocks definition
        private readonly Mock<IGeocodingService> _geocodingServiceMock;
        private readonly Mock<IRepository<TechnicianProfile, Guid>> _technicianRepositoryMock;
        private readonly Mock<IRepository<Booking, Guid>> _bookingRepositoryMock;
        private readonly Mock<IRepository<BookingItem, Guid>> _bookingItemRepositoryMock;
        private readonly Mock<IRepository<HSP.Core.Entities.Service, Guid>> _serviceRepositoryMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<IEmailTemplateService> _emailTemplateServiceMock;
        private readonly Mock<IUserRepository> _userRepositoryMock;
        private readonly Mock<IOptions<UrlSettingsDto>> _urlSettingsMock;
        private readonly Mock<IRedisCacheService> _redisCacheServiceMock;
        private readonly Mock<ISystemSettingService> _systemSettingServiceMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IStringLocalizer<SharedResource>> _localizerMock;

        private readonly ServiceRequestService _service;
        private readonly UrlSettingsDto _urlSettings;

        public ServiceRequestServiceTests()
        {
            // 1. Init Mocks
            _geocodingServiceMock = new Mock<IGeocodingService>();
            _technicianRepositoryMock = new Mock<IRepository<TechnicianProfile, Guid>>();
            _bookingRepositoryMock = new Mock<IRepository<Booking, Guid>>();
            _bookingItemRepositoryMock = new Mock<IRepository<BookingItem, Guid>>();
            _serviceRepositoryMock = new Mock<IRepository<HSP.Core.Entities.Service, Guid>>();
            _emailServiceMock = new Mock<IEmailService>();
            _emailTemplateServiceMock = new Mock<IEmailTemplateService>();
            _userRepositoryMock = new Mock<IUserRepository>();
            _redisCacheServiceMock = new Mock<IRedisCacheService>();
            _systemSettingServiceMock = new Mock<ISystemSettingService>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _localizerMock = new Mock<IStringLocalizer<SharedResource>>();

            // 2. Setup Common Data
            _urlSettings = new UrlSettingsDto { Frontend = "http://localhost", BaseUrl = "http://api" };
            _urlSettingsMock = new Mock<IOptions<UrlSettingsDto>>();
            _urlSettingsMock.Setup(x => x.Value).Returns(_urlSettings);

            // Mock Localization
            _localizerMock.Setup(l => l[It.IsAny<string>()]).Returns((string key) => new LocalizedString(key, key));

            // Mock Transaction
            var transactionMock = new Mock<IDbContextTransaction>();
            _unitOfWorkMock.Setup(u => u.BeginTransactionAsync()).ReturnsAsync(transactionMock.Object);

            // Mock System Settings mặc định
            _systemSettingServiceMock.Setup(x => x.GetValueAsync<int>(SystemSettingRegistry.Keys.TechnicianSearchRadiusKm)).ReturnsAsync(50);
            _systemSettingServiceMock.Setup(x => x.GetValueAsync<int>(SystemSettingRegistry.Keys.TechnicianResponseTimeoutSeconds)).ReturnsAsync(1);
            _systemSettingServiceMock.Setup(x => x.GetValueAsync<int>(SystemSettingRegistry.Keys.TechnicianInvitationExpirationSeconds)).ReturnsAsync(60);

            // 3. Instantiate Service
            _service = new ServiceRequestService(
                _geocodingServiceMock.Object,
                _technicianRepositoryMock.Object,
                _bookingRepositoryMock.Object,
                _bookingItemRepositoryMock.Object,
                _serviceRepositoryMock.Object,
                _emailServiceMock.Object,
                _emailTemplateServiceMock.Object,
                _userRepositoryMock.Object,
                _urlSettingsMock.Object,
                _redisCacheServiceMock.Object,
                _systemSettingServiceMock.Object,
                _unitOfWorkMock.Object,
                _localizerMock.Object
            );
        }

        #region CreateAndMatchBookingAsync Tests

        [Fact]
        public async Task CreateAndMatchBookingAsync_InputNull_ThrowsArgumentNullException()
        {
            await Assert.ThrowsAsync<ArgumentNullException>(() => _service.CreateAndMatchBookingAsync(null));
        }

        [Fact]
        public async Task CreateAndMatchBookingAsync_PastDate_ThrowsValidationException()
        {
            var input = new CustomerCreateBookingDto { DesireDateTime = DateTime.UtcNow.AddHours(-1) };
            var ex = await Assert.ThrowsAsync<System.ComponentModel.DataAnnotations.ValidationException>(() => _service.CreateAndMatchBookingAsync(input));
            Assert.Equal("CannotSelectPastDate", ex.Message);
        }

        [Fact]
        public async Task CreateAndMatchBookingAsync_AddressNull_ThrowsArgumentException()
        {
            var input = new CustomerCreateBookingDto { DesireDateTime = DateTime.UtcNow.AddHours(1), Address = "" };
            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateAndMatchBookingAsync(input));
            Assert.Equal("MustHaveAddress", ex.Message);
        }

        [Fact]
        public async Task CreateAndMatchBookingAsync_GeocodingFailed_ThrowsException()
        {
            var input = new CustomerCreateBookingDto { DesireDateTime = DateTime.UtcNow.AddHours(1), Address = "Unknown" };
            _geocodingServiceMock.Setup(x => x.GetCoordinatesForAddressAsync(input.Address)).ReturnsAsync((CoordinatesDto)null);

            var ex = await Assert.ThrowsAsync<Exception>(() => _service.CreateAndMatchBookingAsync(input));
            Assert.Equal("CannotFoundcoordinates.", ex.Message);
        }

        [Fact]
        public async Task CreateAndMatchBookingAsync_CustomerNotFound_ThrowsInvalidOperationException()
        {
            var input = new CustomerCreateBookingDto
            {
                DesireDateTime = DateTime.UtcNow.AddHours(1),
                Address = "Hanoi",
                CustomerId = Guid.NewGuid().ToString()
            };
            _geocodingServiceMock.Setup(x => x.GetCoordinatesForAddressAsync(input.Address)).ReturnsAsync(new CoordinatesDto { Latitude = 21, Longitude = 105 });
            _userRepositoryMock.Setup(x => x.FindByIdAsync(It.IsAny<Guid>())).ReturnsAsync((AppUser)null);

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateAndMatchBookingAsync(input));
            Assert.Equal("customer is null", ex.Message);
        }

        [Fact]
        public async Task CreateAndMatchBookingAsync_ServicesNotFound_ThrowsException()
        {
            var customerId = Guid.NewGuid();
            var input = new CustomerCreateBookingDto
            {
                DesireDateTime = DateTime.UtcNow.AddHours(1),
                Address = "Hanoi",
                CustomerId = customerId.ToString(),
                ServiceIds = new List<Guid> { Guid.NewGuid() }
            };

            _geocodingServiceMock.Setup(x => x.GetCoordinatesForAddressAsync(input.Address)).ReturnsAsync(new CoordinatesDto { Latitude = 21, Longitude = 105 });
            _userRepositoryMock.Setup(x => x.FindByIdAsync(customerId)).ReturnsAsync(new AppUser { Id = customerId, FullName = "Customer" });

            // Mock Service Repository trả về list rỗng
            var emptyServices = new List<HSP.Core.Entities.Service>().BuildMock();
            _serviceRepositoryMock.Setup(x => x.GetAll(It.IsAny<Expression<Func<HSP.Core.Entities.Service, object>>[]>())).Returns(emptyServices);

            var ex = await Assert.ThrowsAsync<Exception>(() => _service.CreateAndMatchBookingAsync(input));
            Assert.Equal("Không tìm thấy dịch vụ", ex.Message);
        }

        [Fact]
        public async Task CreateAndMatchBookingAsync_NoTechniciansFound_ThrowsInvalidOperationException()
        {
            // Arrange
            var customerId = Guid.NewGuid();
            var serviceId = Guid.NewGuid();
            var input = new CustomerCreateBookingDto
            {
                CustomerId = customerId.ToString(),
                Address = "Valid Address",
                DesireDateTime = DateTime.UtcNow.AddDays(1),
                ServiceIds = new List<Guid> { serviceId }
            };

            _geocodingServiceMock.Setup(x => x.GetCoordinatesForAddressAsync(input.Address))
                .ReturnsAsync(new CoordinatesDto { Latitude = 21.0, Longitude = 105.0 });

            _userRepositoryMock.Setup(x => x.FindByIdAsync(customerId))
                .ReturnsAsync(new AppUser { Id = customerId, FullName = "Test Customer" });

            var services = new List<HSP.Core.Entities.Service>
            {
                new HSP.Core.Entities.Service { Id = serviceId, Price = 100, Name = "Test Service" }
            }.BuildMock();
            _serviceRepositoryMock.Setup(x => x.GetAll(It.IsAny<Expression<Func<HSP.Core.Entities.Service, object>>[]>())).Returns(services);

            // Mock Technician Repository trả về rỗng
            var techs = new List<TechnicianProfile>().BuildMock();
            _technicianRepositoryMock.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>())).Returns(techs);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateAndMatchBookingAsync(input));
            Assert.Equal("NoAvailableTechniciansFound", ex.Message);
        }

        [Fact]
        public async Task CreateAndMatchBookingAsync_TechnicianFound_AcceptsBooking_ReturnsMatched()
        {
            // --- Arrange ---
            var customerId = Guid.NewGuid();
            var serviceId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var input = new CustomerCreateBookingDto
            {
                CustomerId = customerId.ToString(),
                Address = "Valid Address",
                DesireDateTime = DateTime.UtcNow.AddDays(1),
                ServiceIds = new List<Guid> { serviceId }
            };

            _geocodingServiceMock.Setup(x => x.GetCoordinatesForAddressAsync(input.Address))
                .ReturnsAsync(new CoordinatesDto { Latitude = 21.0, Longitude = 105.0 });

            _userRepositoryMock.Setup(x => x.FindByIdAsync(customerId))
                .ReturnsAsync(new AppUser { Id = customerId, FullName = "Test Customer" });

            var services = new List<HSP.Core.Entities.Service>
            {
                new HSP.Core.Entities.Service { Id = serviceId, Price = 100, Name = "Test Service" }
            }.BuildMock();
            _serviceRepositoryMock.Setup(x => x.GetAll(It.IsAny<Expression<Func<HSP.Core.Entities.Service, object>>[]>())).Returns(services);

            // Tạo Technician ở gần (Inline)
            var tech = new TechnicianProfile
            {
                Id = techId,
                UserId = Guid.NewGuid(),
                User = new AppUser { FullName = "Tech 1", Email = $"user_{techId}@test.com" },
                Latitude = 21.001,
                Longitude = 105.001,
                ApprovalStatus = TechnicianApprovalStatus.Approved,
                Services = new List<HSP.Core.Entities.Service> { new HSP.Core.Entities.Service { Id = serviceId } },
                Bookings = new List<Booking>()
            };

            var techs = new List<TechnicianProfile> { tech }.BuildMock();
            _technicianRepositoryMock.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>())).Returns(techs);

            // Mock System Settings: Timeout 5s
            _systemSettingServiceMock.Setup(x => x.GetValueAsync<int>(SystemSettingRegistry.Keys.TechnicianResponseTimeoutSeconds)).ReturnsAsync(5);

            // Mock Redis Flow
            _redisCacheServiceMock.Setup(x => x.GetAsync<string>(It.Is<string>(s => s.StartsWith("reject_")))).ReturnsAsync((string)null);
            _redisCacheServiceMock.Setup(x => x.GetAsync<Guid>(It.Is<string>(s => s.StartsWith("accepted_")))).ReturnsAsync(techId);

            // --- Act ---
            var result = await _service.CreateAndMatchBookingAsync(input);

            // --- Assert ---
            Assert.True(result.IsMatched);
            Assert.Equal("Đã ghép kỹ thuật viên thành công", result.Message);
            Assert.Equal(techId, result.TechnicianInfo.Id);

            _bookingRepositoryMock.Verify(x => x.AddAsync(It.IsAny<Booking>()), Times.Once);
            _unitOfWorkMock.Verify(x => x.SaveChangesAsync(), Times.AtLeast(2));
            _emailServiceMock.Verify(x => x.SendEmailAsync(It.IsAny<EmailDto>()), Times.Once);
            _redisCacheServiceMock.Verify(x => x.RemoveAsync(It.Is<string>(s => s.StartsWith("waiting_"))), Times.AtLeastOnce);
        }

        [Fact]
        public async Task CreateAndMatchBookingAsync_TechnicianFound_Timeout_ReturnsNotMatched()
        {
            // --- Arrange ---
            var customerId = Guid.NewGuid();
            var serviceId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var input = new CustomerCreateBookingDto
            {
                CustomerId = customerId.ToString(),
                Address = "Valid Address",
                DesireDateTime = DateTime.UtcNow.AddDays(1),
                ServiceIds = new List<Guid> { serviceId }
            };

            _geocodingServiceMock.Setup(x => x.GetCoordinatesForAddressAsync(input.Address))
                .ReturnsAsync(new CoordinatesDto { Latitude = 21.0, Longitude = 105.0 });

            _userRepositoryMock.Setup(x => x.FindByIdAsync(customerId))
                .ReturnsAsync(new AppUser { Id = customerId, FullName = "Test Customer" });

            var services = new List<HSP.Core.Entities.Service>
            {
                new HSP.Core.Entities.Service { Id = serviceId, Price = 100, Name = "Test Service" }
            }.BuildMock();
            _serviceRepositoryMock.Setup(x => x.GetAll(It.IsAny<Expression<Func<HSP.Core.Entities.Service, object>>[]>())).Returns(services);

            var tech = new TechnicianProfile
            {
                Id = techId,
                UserId = Guid.NewGuid(),
                User = new AppUser { FullName = "Tech 1", Email = $"user_{techId}@test.com" },
                Latitude = 21.001,
                Longitude = 105.001,
                ApprovalStatus = TechnicianApprovalStatus.Approved,
                Services = new List<HSP.Core.Entities.Service> { new HSP.Core.Entities.Service { Id = serviceId } },
                Bookings = new List<Booking>()
            };

            var techs = new List<TechnicianProfile> { tech }.BuildMock();
            _technicianRepositoryMock.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>())).Returns(techs);

            // Giả lập DB sinh ID khi AddAsync được gọi
            _bookingRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Booking>()))
                .Callback<Booking>(b => b.Id = Guid.NewGuid())
                .ReturnsAsync((Booking b) => b);

            // Set timeout = 0
            _systemSettingServiceMock.Setup(x => x.GetValueAsync<int>(SystemSettingRegistry.Keys.TechnicianResponseTimeoutSeconds)).ReturnsAsync(0);

            // Redis trả về null/empty
            _redisCacheServiceMock.Setup(x => x.GetAsync<string>(It.IsAny<string>())).ReturnsAsync((string)null);
            _redisCacheServiceMock.Setup(x => x.GetAsync<Guid>(It.IsAny<string>())).ReturnsAsync(Guid.Empty);

            // --- Act ---
            var result = await _service.CreateAndMatchBookingAsync(input);

            // --- Assert ---
            Assert.False(result.IsMatched);
            Assert.Equal("Không có kỹ thuật viên nào chấp nhận yêu cầu.", result.Message);
            Assert.NotEqual(Guid.Empty, result.BookingId);

            _unitOfWorkMock.Verify(x => x.SaveChangesAsync(), Times.AtLeast(2));
        }

        [Fact]
        public async Task CreateAndMatchBookingAsync_TechnicianRejects_ReturnsNotMatched()
        {
            // --- Arrange ---
            var customerId = Guid.NewGuid();
            var serviceId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var input = new CustomerCreateBookingDto
            {
                CustomerId = customerId.ToString(),
                Address = "Valid Address",
                DesireDateTime = DateTime.UtcNow.AddDays(1),
                ServiceIds = new List<Guid> { serviceId }
            };

            _geocodingServiceMock.Setup(x => x.GetCoordinatesForAddressAsync(input.Address))
                .ReturnsAsync(new CoordinatesDto { Latitude = 21.0, Longitude = 105.0 });

            _userRepositoryMock.Setup(x => x.FindByIdAsync(customerId))
                .ReturnsAsync(new AppUser { Id = customerId, FullName = "Test Customer" });

            var services = new List<HSP.Core.Entities.Service>
            {
                new HSP.Core.Entities.Service { Id = serviceId, Price = 100, Name = "Test Service" }
            }.BuildMock();
            _serviceRepositoryMock.Setup(x => x.GetAll(It.IsAny<Expression<Func<HSP.Core.Entities.Service, object>>[]>())).Returns(services);

            var tech = new TechnicianProfile
            {
                Id = techId,
                UserId = Guid.NewGuid(),
                User = new AppUser { FullName = "Tech 1", Email = $"user_{techId}@test.com" },
                Latitude = 21.001,
                Longitude = 105.001,
                ApprovalStatus = TechnicianApprovalStatus.Approved,
                Services = new List<HSP.Core.Entities.Service> { new HSP.Core.Entities.Service { Id = serviceId } },
                Bookings = new List<Booking>()
            };

            var techs = new List<TechnicianProfile> { tech }.BuildMock();
            _technicianRepositoryMock.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>())).Returns(techs);

            _systemSettingServiceMock.Setup(x => x.GetValueAsync<int>(SystemSettingRegistry.Keys.TechnicianResponseTimeoutSeconds)).ReturnsAsync(2);

            _redisCacheServiceMock.SetupSequence(x => x.GetAsync<string>(It.Is<string>(s => s.StartsWith("reject_"))))
                .ReturnsAsync((string)null)
                .ReturnsAsync("rejected");

            // --- Act ---
            var result = await _service.CreateAndMatchBookingAsync(input);

            // --- Assert ---
            Assert.False(result.IsMatched);
            _redisCacheServiceMock.Verify(x => x.RemoveAsync(It.Is<string>(s => s.StartsWith("waiting_"))), Times.AtLeastOnce);
        }

        #endregion

        #region SearchNearbyTechniciansAsync Tests

        [Fact]
        public async Task SearchNearbyTechniciansAsync_AddressNull_ThrowsArgumentException()
        {
            var input = new SearchTechnicianInput { Address = "" };
            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.SearchNearbyTechniciansAsync(input));
            Assert.Equal("MustHaveAddress", ex.Message);
        }

        [Fact]
        public async Task SearchNearbyTechniciansAsync_GeocodingFailed_ThrowsException()
        {
            var input = new SearchTechnicianInput { Address = "Bad Address" };
            _geocodingServiceMock.Setup(x => x.GetCoordinatesForAddressAsync(input.Address)).ReturnsAsync((CoordinatesDto)null);

            var ex = await Assert.ThrowsAsync<Exception>(() => _service.SearchNearbyTechniciansAsync(input));
            Assert.Equal("CannotFoundcoordinates.", ex.Message);
        }

        [Fact]
        public async Task SearchNearbyTechniciansAsync_ReturnsSortedList()
        {
            // --- Arrange ---
            var input = new SearchTechnicianInput { Address = "Center", ServiceIds = new List<Guid>() };
            var centerLat = 10.0;
            var centerLon = 10.0;

            _geocodingServiceMock.Setup(x => x.GetCoordinatesForAddressAsync(input.Address))
                .ReturnsAsync(new CoordinatesDto { Latitude = centerLat, Longitude = centerLon });

            var serviceId = Guid.NewGuid();

            // Tech 1: Rất gần (~0 km)
            var tech1 = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                User = new AppUser { FullName = "Close Tech", Email = "tech1@test.com" },
                Latitude = 10.001,
                Longitude = 10.001,
                ApprovalStatus = TechnicianApprovalStatus.Approved,
                Services = new List<HSP.Core.Entities.Service> { new HSP.Core.Entities.Service { Id = serviceId } },
                Bookings = new List<Booking>
                {
                    // Quan trọng: Status Completed để không bị filter là đang bận
                    new Booking
                    {
                        Status = BookingStatus.Completed,
                        Feedbacks = new List<BookingFeedback>
                        {
                            new BookingFeedback { Source = FeedbackSource.Customer, Rating = 5 }
                        }
                    }
                }
            };

            // Tech 2: Xa hơn
            var tech2 = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                User = new AppUser { FullName = "Far Tech", Email = "tech2@test.com" },
                Latitude = 10.1,
                Longitude = 10.1,
                ApprovalStatus = TechnicianApprovalStatus.Approved,
                Services = new List<HSP.Core.Entities.Service> { new HSP.Core.Entities.Service { Id = serviceId } },
                Bookings = new List<Booking>()
            };

            // Tech 3: Quá xa (> 50km)
            var tech3 = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                User = new AppUser { FullName = "Too Far Tech", Email = "tech3@test.com" },
                Latitude = 15.0,
                Longitude = 15.0,
                ApprovalStatus = TechnicianApprovalStatus.Approved,
                Services = new List<HSP.Core.Entities.Service> { new HSP.Core.Entities.Service { Id = serviceId } },
                Bookings = new List<Booking>()
            };

            var techs = new List<TechnicianProfile> { tech3, tech2, tech1 }.BuildMock();
            _technicianRepositoryMock.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>())).Returns(techs);

            // --- Act ---
            var result = await _service.SearchNearbyTechniciansAsync(input);

            // --- Assert ---
            var resultList = result.ToList();
            Assert.Equal(2, resultList.Count);

            Assert.Equal(tech1.Id, resultList[0].Id);
            Assert.Equal(tech2.Id, resultList[1].Id);

            Assert.Equal(5, resultList[0].Rating);
            Assert.Equal(1, resultList[0].RatingCount);
            Assert.True(resultList[0].DistanceKm < resultList[1].DistanceKm);
        }

        #endregion
    }
}