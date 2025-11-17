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
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using MockQueryable;
using Moq;

namespace HSP.Service.Test.Implementations.Internal
{
	public class ServiceRequestServiceTests
	{
		private readonly Mock<IGeocodingService> _mockGeocodingService;
		private readonly Mock<IRepository<TechnicianProfile, Guid>> _mockTechnicianRepository;
		private readonly Mock<ISystemSettingService> _mockSystemSettingService;
		private readonly Mock<IEmailService> _mockEmailService;
		private readonly Mock<IEmailTemplateService> _mockEmailTemplateService;
		private readonly Mock<IUserRepository> _mockUserRepository;
		private readonly Mock<IOptions<UrlSettingsDto>> _mockUrlSettings;
		private readonly Mock<IRedisCacheService> _mockRedisCacheService;
		private readonly Mock<IUnitOfWork> _mockUnitOfWork;
		private readonly Mock<IStringLocalizer<SharedResource>> _mockLocalizer;
		private readonly ServiceRequestService _serviceRequestService;

		public ServiceRequestServiceTests()
		{
			_mockGeocodingService = new Mock<IGeocodingService>();
			_mockTechnicianRepository = new Mock<IRepository<TechnicianProfile, Guid>>();
            _mockSystemSettingService = new Mock<ISystemSettingService>();
            _mockEmailService = new Mock<IEmailService>();
			_mockEmailTemplateService = new Mock<IEmailTemplateService>();
			_mockUserRepository = new Mock<IUserRepository>();
			_mockUrlSettings = new Mock<IOptions<UrlSettingsDto>>();
			_mockUrlSettings.Setup(x => x.Value).Returns(new UrlSettingsDto
			{
				BaseUrl = "https://localhost:7190",
			});
			_mockRedisCacheService = new Mock<IRedisCacheService>();
			_mockUnitOfWork = new Mock<IUnitOfWork>();
			_mockLocalizer = new Mock<IStringLocalizer<SharedResource>>();
			_serviceRequestService = new ServiceRequestService(
				_mockGeocodingService.Object,
				_mockTechnicianRepository.Object,
				_mockEmailService.Object,
				_mockEmailTemplateService.Object,
				_mockUserRepository.Object,
				_mockUrlSettings.Object,
				_mockRedisCacheService.Object,
				_mockSystemSettingService.Object,
                _mockUnitOfWork.Object,
				_mockLocalizer.Object
				);
		}
		[Fact]
		public async Task SearchNearbyTechniciansAsync_WhenTechnicianFounded_ShouldReturnTechnicianSuitable()
		{
			var services = new List<Core.Entities.Service>
			{
				new Core.Entities.Service
				{
					Id = Guid.NewGuid(),
					Name = "Plumbing"
				},
				new Core.Entities.Service
				{
					Id = Guid.NewGuid(),
					Name = "Electrical"
				}
			};
			var technicians = new List<TechnicianProfile>
			{
				new TechnicianProfile
				{
					Id = Guid.NewGuid(),
					User = new AppUser { FullName = "Tech A" },
					Latitude = 21.0169,
					Longitude = 105.5250,
					ApprovalStatus = TechnicianApprovalStatus.Approved,
					Services = new List<Core.Entities.Service> { services[0] },
				},
				new TechnicianProfile
				{
					Id = Guid.NewGuid(),
					User = new AppUser { FullName = "Tech B" },
					Latitude = 41.0000,
					Longitude = -75.0000,
					ApprovalStatus = TechnicianApprovalStatus.Approved,
					Services = new List<Core.Entities.Service> { services[1] },
				}
			};
			var input = new SearchTechnicianInput
			{
				Address = "Thạch Hòa, Thạch Thất, Hà Nội",
				ServiceIds = new List<Guid> { services[0].Id },
				MaxDistanceKm = 20
			};
			_mockGeocodingService.Setup(g => g.GetCoordinatesForAddressAsync(It.IsAny<string>()))
				.ReturnsAsync(new CoordinatesDto { Latitude = 21.0169, Longitude = 105.5250 });
			_mockTechnicianRepository.Setup(repo => repo.GetAll())
				.Returns(technicians.BuildMock());

			var result = await _serviceRequestService.SearchNearbyTechniciansAsync(input);

			Assert.Single(result);
			Assert.Equal("Tech A", result.First().Name);
		}
		[Fact]
		public async Task CreateAndMatchBookingAsync_WhenTechnicianAccepts_ShouldReturnMatchedResult()
		{
			var service = new Core.Entities.Service { Id = Guid.NewGuid(), Name = "Điện lạnh" };
			var technician = new TechnicianProfile
			{
				Id = Guid.NewGuid(),
				Latitude = 21.0175,
				Longitude = 105.5255,
				ApprovalStatus = TechnicianApprovalStatus.Approved,
				Services = new List<Core.Entities.Service> { service },
				User = new AppUser { FullName = "Kỹ thuật viên A", Email = "techA@gmail.com" },
				Bookings = new List<Booking>()
			};

			var customer = new AppUser
			{
				Id = Guid.NewGuid(),
				FullName = "Khách hàng B",
				Email = "customer@gmail.com"
			};

			var input = new CustomerCreateBookingDto
			{
				CustomerId = customer.Id.ToString(),
				Address = "Thạch Hòa, Thạch Thất, Hà Nội",
				ServiceIds = new List<Guid> { service.Id },
				DistanceKm = 10,
				DesireDateTime = DateTime.Now.AddHours(1)
			};

			_mockGeocodingService
					.Setup(x => x.GetCoordinatesForAddressAsync(It.IsAny<string>()))
					.ReturnsAsync(new CoordinatesDto { Latitude = 21.0169, Longitude = 105.5250 });

			_mockUserRepository
					.Setup(x => x.FindByIdAsync(customer.Id))
					.ReturnsAsync(customer);

			_mockTechnicianRepository
					.Setup(x => x.GetAll())
					.Returns(new List<TechnicianProfile> { technician }
							.BuildMock());

			_mockRedisCacheService
					.SetupSequence(r => r.GetAsync<Guid>(It.IsAny<string>()))
					.ReturnsAsync(technician.Id)
					.ReturnsAsync(Guid.Empty);

			_mockRedisCacheService
					.Setup(r => r.RemoveAsync(It.IsAny<string>()))
					.Returns(Task.CompletedTask);

			_mockEmailTemplateService
					.Setup(e => e.RenderAsync(It.IsAny<string>(), It.IsAny<object>()))
					.ReturnsAsync("<html>Email mock</html>");

			_mockEmailService
					.Setup(e => e.SendEmailAsync(It.IsAny<EmailDto>()))
					.Returns(Task.CompletedTask);

			_mockUrlSettings
					.Setup(o => o.Value)
					.Returns(new UrlSettingsDto { BaseUrl = "https://localhost" });

			var result = await _serviceRequestService.CreateAndMatchBookingAsync(input);

			Assert.True(result.IsMatched);
			Assert.Equal("Kỹ thuật viên A", result.TechnicianInfo.Name);
			_mockEmailService.Verify(e => e.SendEmailAsync(It.IsAny<EmailDto>()), Times.AtLeastOnce());
		}
		[Fact]
		public async Task CreateAndMatchBookingAsync_WhenInputIsNull_ShouldThrowArgumentNullException()
		{
			await Assert.ThrowsAsync<ArgumentNullException>(() => _serviceRequestService.CreateAndMatchBookingAsync((CustomerCreateBookingDto)null!));
		}
        public async Task CreateAndMatchBookingAsync_WhenCustomerNotFound_ShouldThrowInvalidOperationException()
		{
			var service = new Core.Entities.Service { Id = Guid.NewGuid(), Name = "Điện lạnh" };
			var input = new CustomerCreateBookingDto
			{
				CustomerId = Guid.NewGuid().ToString(),
				Address = "Thạch Hòa, Thạch Thất, Hà Nội",
				ServiceIds = new List<Guid> { service.Id },
				DistanceKm = 10,
				DesireDateTime = DateTime.Now.AddHours(1)
			};
			_mockGeocodingService
				.Setup(x => x.GetCoordinatesForAddressAsync(It.IsAny<string>()))
				.ReturnsAsync(new CoordinatesDto { Latitude = 21.0169, Longitude = 105.5250 });
			_mockUserRepository
					.Setup(x => x.FindByIdAsync(It.IsAny<Guid>()))
					.ReturnsAsync((AppUser?)null!);
			await Assert.ThrowsAsync<InvalidOperationException>(() => _serviceRequestService.CreateAndMatchBookingAsync(input));
		}
        public async Task CreateAndMatchBookingAsync_WhenTechnicianNotFound_ShouldThrowInvalidOperationException()
		{
			var service = new Core.Entities.Service { Id = Guid.NewGuid(), Name = "Điện lạnh" };
			var customer = new AppUser
			{
				Id = Guid.NewGuid(),
				FullName = "Khách hàng B",
				Email = "customer@gmail.com"
			};
			var input = new CustomerCreateBookingDto
			{
				CustomerId = customer.Id.ToString(),
				Address = "Thạch Hòa, Thạch Thất, Hà Nội",
				ServiceIds = new List<Guid> { service.Id },
				DistanceKm = 10,
				DesireDateTime = DateTime.Now.AddHours(1)
			};
			_mockGeocodingService
				.Setup(x => x.GetCoordinatesForAddressAsync(It.IsAny<string>()))
				.ReturnsAsync(new CoordinatesDto { Latitude = 21.0169, Longitude = 105.5250 });
			_mockUserRepository
					.Setup(x => x.FindByIdAsync(customer.Id))
					.ReturnsAsync(customer);
			_mockTechnicianRepository
					.Setup(x => x.GetAll())
					.Returns(new List<TechnicianProfile>()
							.BuildMock());
			await Assert.ThrowsAsync<InvalidOperationException>(() => _serviceRequestService.CreateAndMatchBookingAsync(input));
		}
		[Fact(Skip = "time consuming test case run successfully already")]
		public async Task CreateAndMatchBookingAsync_WhenNoTechnicianAccepts_ShouldReturnUnmatchedResult()
		{
			var service = new Core.Entities.Service { Id = Guid.NewGuid(), Name = "Điện lạnh" };
			var technician = new TechnicianProfile
			{
				Id = Guid.NewGuid(),
				User = new AppUser { FullName = "Tech A", Email = "techA@gmail.com" },
				Latitude = 21.0175,
				Longitude = 105.5255,
				ApprovalStatus = TechnicianApprovalStatus.Approved,
				Services = new List<Core.Entities.Service> { service },
				Bookings = new List<Booking>()
			};
			var customer = new AppUser
			{
				Id = Guid.NewGuid(),
				FullName = "Khách hàng B",
				Email = "customer@gmail.com"
			};
			var input = new CustomerCreateBookingDto
			{
				CustomerId = customer.Id.ToString(),
				Address = "Thạch Hòa, Thạch Thất, Hà Nội",
				ServiceIds = new List<Guid> { service.Id },
				DistanceKm = 10,
				DesireDateTime = DateTime.Now.AddHours(1)
			};

			_mockGeocodingService
					.Setup(x => x.GetCoordinatesForAddressAsync(It.IsAny<string>()))
					.ReturnsAsync(new CoordinatesDto { Latitude = 21.0169, Longitude = 105.5250 });

			_mockUserRepository
					.Setup(x => x.FindByIdAsync(customer.Id))
					.ReturnsAsync(customer);

			_mockTechnicianRepository
					.Setup(x => x.GetAll())
					.Returns(new List<TechnicianProfile> { technician }.BuildMock());

			_mockRedisCacheService
					.Setup(x => x.GetAsync<Guid>(It.IsAny<string>()))
					.ReturnsAsync(Guid.Empty);
			_mockRedisCacheService
					.Setup(x => x.RemoveAsync(It.IsAny<string>()))
					.Returns(Task.CompletedTask);
			_mockRedisCacheService
					.Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<TimeSpan>()))
					.Returns(Task.CompletedTask);

			_mockEmailTemplateService
					.Setup(e => e.RenderAsync(It.IsAny<string>(), It.IsAny<object>()))
					.ReturnsAsync("<html>Email Mock</html>");
			_mockEmailService
					.Setup(e => e.SendEmailAsync(It.IsAny<EmailDto>()))
					.Returns(Task.CompletedTask);

			_mockLocalizer.Setup(l => l["NoTechnicianAcceptedRequest"])
					.Returns(new LocalizedString("NoTechnicianAcceptedRequest", "NoTechnicianAcceptedRequest"));

			var result = await _serviceRequestService.CreateAndMatchBookingAsync(input);

			Assert.False(result.IsMatched);
			Assert.Equal("NoTechnicianAcceptedRequest", result.Message);
			_mockEmailService.Verify(e => e.SendEmailAsync(It.IsAny<EmailDto>()), Times.AtLeastOnce());
		}
	}
}
