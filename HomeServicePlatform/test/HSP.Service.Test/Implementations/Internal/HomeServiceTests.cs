using HSP.Core.Dtos.MapDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.Service.Dtos.HomeDto;
using Microsoft.Extensions.Localization;
using Moq;
using System.ComponentModel.DataAnnotations;
using MockQueryable;
using HSP.Core.Dtos.HomeDto;
using HSP.Service.Implementations.Internal;

namespace HSP.Service.Test.Implementations.Internal
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

			await Assert.ThrowsAsync<ValidationException>(() => _homeService.CreateHomeAsync(input, customerProfileId));
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
			var userId = Guid.NewGuid();
			var homes = new List<Home>
			{
					new Home
					{
							Id = homeId,
							CustomerId = userId,
					}
			};
			var mockQueryable = homes.BuildMock();
			_mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);
			_mockHomeRepository
				.Setup(r => r.GetAll())
				.Returns(mockQueryable);

			var result = await _homeService.DeleteHomeAsynce(homeId, userId);

			Assert.True(result);
			_mockHomeRepository.Verify(r => r.DeleteAsync(homeId), Times.Once);
			_mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
		}
		[Fact]
		public async Task DeleteHomeAsync_WhenHomeNotFound_ShouldThrowValidationException()
		{
			var homeId = Guid.NewGuid();
			var userId = Guid.NewGuid();
			var homes = new List<Home>();
			var mockQueryable = homes.BuildMock();
			_mockHomeRepository
				.Setup(r => r.GetAll())
				.Returns(mockQueryable);

			await Assert.ThrowsAsync<ValidationException>(() => _homeService.DeleteHomeAsynce(homeId, userId));
			_mockHomeRepository.Verify(r => r.DeleteAsync(It.IsAny<Guid>()), Times.Never);
			_mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
		}
		
		[Fact]
		public async Task UpdateHomeAsync_WithValidInput_ShouldUpdateAndReturnTrue()
		{
			var homeId = Guid.NewGuid();
			var userId = Guid.NewGuid();
			var input = new UpdateHomeDto { Name = "Updated Home", Address = "456 valid street" };
			var coordinates = new CoordinatesDto { Latitude = 30.0, Longitude = 40.0 };
			var homeToUpdate = new Home
			{
				Id = homeId,
				Name = "Old Home",
				Address = "123 old street",
				CustomerProfile = new AppUser { Id = userId }
			};
			var homes = new List<Home>{ homeToUpdate };
			var mockQueryable = homes.BuildMock();
			_mockGeocodingService.Setup(s => s.GetCoordinatesForAddressAsync(input.Address))
						.ReturnsAsync(coordinates);
			_mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);
			_mockHomeRepository
				.Setup(r => r.GetAll())
				.Returns(mockQueryable);
			
			var result = await _homeService.UpdateHomeAsync(homeId, input, userId);
			
			Assert.True(result);
			Assert.Equal("Updated Home", homeToUpdate.Name);
			Assert.Equal("456 valid street", homeToUpdate.Address);
			Assert.Equal(30.0, homeToUpdate.Latitude);
			_mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
			_mockHomeRepository.Verify(r => r.GetAll(), Times.Once);
		}
		[Fact]
		public async Task UpdateHomeAsync_WhenHomeNotFound_ShouldThrowValidationException()
		{
			var homeId = Guid.NewGuid();
			var userId = Guid.NewGuid();
			var input = new UpdateHomeDto { Name = "Updated Home", Address = "456 valid street" };
			var homes = new List<Home>();
			var mockQueryable = homes.BuildMock();
			_mockHomeRepository
				.Setup(r => r.GetAll())
				.Returns(mockQueryable);
			await Assert.ThrowsAsync<ValidationException>(() => _homeService.UpdateHomeAsync(homeId, input, userId));
			_mockGeocodingService.Verify(s => s.GetCoordinatesForAddressAsync(It.IsAny<string>()), Times.Never);
			_mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
			_mockHomeRepository.Verify(r => r.GetAll(), Times.Once);
		}
		[Fact]
		public async Task UpdateHomeAsync_WithInvalidAddress_ShouldThrowValidationException()
		{
			var homeId = Guid.NewGuid();
			var userId = Guid.NewGuid();
			var input = new UpdateHomeDto { Name = "Updated Home", Address = "invalid address" };
			var homes = new List<Home>
			{
					new Home
					{
							Id = homeId,
							Name = "Old Home",
							Address = "123 old street",
							Latitude = 10.0,
							Longitude = 20.0,
							CustomerProfile = new AppUser { Id = userId }
					}
			};
			var mockQueryable = homes.BuildMock();
			_mockHomeRepository
				.Setup(r => r.GetAll())
				.Returns(mockQueryable);
			_mockGeocodingService.Setup(s => s.GetCoordinatesForAddressAsync(input.Address))
						.ReturnsAsync((CoordinatesDto?)null);
			await Assert.ThrowsAsync<ValidationException>(() => _homeService.UpdateHomeAsync(homeId, input, userId));
			_mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
			_mockHomeRepository.Verify(r => r.GetAll(), Times.Once);
			_mockGeocodingService.Verify(s => s.GetCoordinatesForAddressAsync(input.Address), Times.Once);
		}
		[Fact]
		public async Task UpdateHomeAsync_WithNullInput_ShouldThrowArgumentException()
		{
			var homeId = Guid.NewGuid();
			var userId = Guid.NewGuid();
			await Assert.ThrowsAsync<ArgumentException>(() => _homeService.UpdateHomeAsync(homeId, null!, userId));
			_mockHomeRepository.Verify(r => r.GetAll(), Times.Never);
			_mockGeocodingService.Verify(s => s.GetCoordinatesForAddressAsync(It.IsAny<string>()), Times.Never);
			_mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
		}
		[Fact]
		public async Task GetHomeByIdAsync_WithValidId_ShouldReturnHomeDto()
		{
			var homeId = Guid.NewGuid();
			var userId = Guid.NewGuid();
			var homes = new List<Home>
			{
					new Home
					{
							Id = homeId,
							Name = "My Home",
							Address = "123 street",
							Latitude = 10.0,
							Longitude = 20.0,
							CustomerId = Guid.NewGuid(),
							CustomerProfile = new AppUser { Id = userId }
					}
			};
			var mockQueryable = homes.BuildMock();
			_mockHomeRepository
				.Setup(r => r.GetAll())
				.Returns(mockQueryable);
			var result = await _homeService.GetHomeByIdAsync(homeId, userId);
			Assert.NotNull(result);
			Assert.Equal(homeId, result.Id);
			Assert.Equal("My Home", result.Name);
			Assert.Equal("123 street", result.Address);
			Assert.Equal(10.0, result.Latitude);
			Assert.Equal(20.0, result.Longitude);
			_mockHomeRepository.Verify(r => r.GetAll(), Times.Once);
		}

		[Fact]
		public async Task GetHomeByIdAsync_WhenHomeNotFound_ShouldThrowValidationException()
		{
			var homeId = Guid.NewGuid();
			var userId = Guid.NewGuid();
			var homes = new List<Home>();
			var mockQueryable = homes.BuildMock();
			_mockHomeRepository
				.Setup(r => r.GetAll())
				.Returns(mockQueryable);
			await Assert.ThrowsAsync<ValidationException>(() => _homeService.GetHomeByIdAsync(homeId, userId));
			_mockHomeRepository.Verify(r => r.GetAll(), Times.Once);
		}
		[Fact]
		public async Task GetAllHomesAsync_ShouldReturnFilteredHomes()
		{
			var userId = Guid.NewGuid();
			var input = new HomeInput { Search = "home" };
			var homes = new List<Home>
			{
					new Home { Name = "home sweet", CustomerProfile = new AppUser { Id = userId } },
					new Home { Name = "villa", CustomerProfile = new AppUser { Id = userId } }
			};
			var mockQueryable = homes.BuildMock();

			_mockHomeRepository.Setup(r => r.GetAll()).Returns(mockQueryable);

			var result = await _homeService.GetAllHomesAsync(input, userId);

			Assert.All(result.Items, h => Assert.Contains("home", h.Name, StringComparison.OrdinalIgnoreCase));
		}
	}
}
