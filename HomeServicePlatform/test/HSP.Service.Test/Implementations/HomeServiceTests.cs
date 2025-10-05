using HSP.Core.Dtos.MapDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.Service.Dtos.HomeDto;
using HSP.Service.Implementations;
using Microsoft.Extensions.Localization;
using Moq;

namespace HSP.Service.Test.Implementations
{
	public class HomeServiceTests
	{
		private readonly Mock<IRepository<Home, Guid>> _mockHomeRepository;
		private readonly Mock<IUnitOfWork> _mockUnitOfWork;
		private readonly Mock<IGeocodingService> _mockGeocodingService;
		private readonly Mock<IStringLocalizer<SharedResource>> _mockLocalizer;
		private readonly HomeService _homeService;

		public HomeServiceTests()
		{
			_mockHomeRepository = new Mock<IRepository<Home, Guid>>();
			_mockUnitOfWork = new Mock<IUnitOfWork>();
			_mockGeocodingService = new Mock<IGeocodingService>();
			_mockLocalizer = new Mock<IStringLocalizer<SharedResource>>();
			_homeService = new HomeService(_mockGeocodingService.Object,
						_mockHomeRepository.Object,
						_mockUnitOfWork.Object,
						_mockLocalizer.Object);
		}
		[Fact]
		public async Task CreateHomeAsync_WithValidAddress_ShouldCreateAndReturnHomeId()
		{
			var input = new CreateHomeDto { Name = "My Home", Address = "123 valid street" };
			var customerProfileId = Guid.NewGuid();
			var coordinates = new CoordinatesDto { Latitude = 10.0, Longitude = 20.0 };
			_mockGeocodingService.Setup(s => s.GetCoordinatesForAddressAsync(input.Address))
						.ReturnsAsync(coordinates);
			_mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);
			_mockHomeRepository.Setup(r => r.AddAsync(It.IsAny<Home>()))
						.Callback<Home>(h => h.Id = Guid.NewGuid());

			var result = await _homeService.CreateHomeAsync(input, customerProfileId);

			Assert.NotEqual(Guid.Empty, result);
			_mockHomeRepository.Verify(r => r.AddAsync(It.IsAny<Home>()), Times.Once);
			_mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
		}
	}
}
