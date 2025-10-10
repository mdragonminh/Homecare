using HSP.Core.Dtos.MapDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.Service.Dtos.HomeDto;
using HSP.Service.Implementations;
using Microsoft.Extensions.Localization;
using Moq;
using System.ComponentModel.DataAnnotations;

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
		[Fact]
		public async Task CreateHomeAsync_WithInvalidAddress_ShouldThrowValidationException()
		{
			var input = new CreateHomeDto { Name = "My Home", Address = "invalid address" };
			var customerProfileId = Guid.NewGuid();
			_mockGeocodingService.Setup(s => s.GetCoordinatesForAddressAsync(input.Address))
						.ReturnsAsync((CoordinatesDto?)null);

			await Assert.ThrowsAsync<ValidationException>(()=>_homeService.CreateHomeAsync(input, customerProfileId));
			_mockHomeRepository.Verify(r => r.AddAsync(It.IsAny<Home>()), Times.Never);
			_mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
		}
		[Fact]
		public async Task CreateHomeAsync_WithNullArgument_ShouldThrowArgumentException()
		{
			var customerProfileId = Guid.NewGuid();
			await Assert.ThrowsAsync<ArgumentException>(() => _homeService.CreateHomeAsync(null!, customerProfileId));
			_mockGeocodingService.Verify(s => s.GetCoordinatesForAddressAsync(It.IsAny<string>()), Times.Never);
			_mockHomeRepository.Verify(r => r.AddAsync(It.IsAny<Home>()), Times.Never);
			_mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
		}
		[Fact]
		public async Task DeleteHomeAsync_WithValidHomeId_ShouldDeleteAndReturnTrue()
		{
			var homeId = Guid.NewGuid();
			var userId = Guid.NewGuid().ToString();
			//var mockHomeSet = new List<Home> { home }.AsQueryable().BuildMockDbSet();
			//_mockHomeRepository.Setup(r => r.GetAll()).Returns(mockHomeSet.Object);
			_mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);
			_mockHomeRepository.Setup(r => r.DeleteAsync(homeId)).Returns(Task.CompletedTask);
			
			var result = await _homeService.DeleteHomeAsynce(homeId, userId);

			Assert.True(result);
			_mockHomeRepository.Verify(r => r.DeleteAsync(homeId), Times.Once);
			_mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
		}
	}
}
