using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Implementations;
using Microsoft.Extensions.Localization;
using MockQueryable;
using Moq;

namespace HSP.Service.Test.Implementations
{
	public class HomeServiceServiceTests
	{
		private readonly Mock<IRepository<Core.Entities.Service, Guid>> _mockHomeServiceRepository;
		private readonly Mock<IUnitOfWork> _mockUnitOfWork;
		private readonly Mock<IStringLocalizer<SharedResource>> _mockLocalizer;
		private readonly HomeServiceService _homeServiceService;

		public HomeServiceServiceTests()
		{
			_mockHomeServiceRepository = new Mock<IRepository<Core.Entities.Service, Guid>>();
			_mockUnitOfWork = new Mock<IUnitOfWork>();
			_mockLocalizer = new Mock<IStringLocalizer<SharedResource>>();
			_homeServiceService = new HomeServiceService
			(
				_mockHomeServiceRepository.Object,
				_mockUnitOfWork.Object,
				_mockLocalizer.Object
			);
		}
		[Fact]
		public async Task CreateHomeServiceAsync_WithValidInput_ShouldCreateServiceAndReturnId()
		{
			var userId = Guid.NewGuid();
			var input = new Core.Dtos.ServiceDto.CreateHomeServiceDto
			{
				Name = "Cleaning",
				Description = "House cleaning service",
				DateCreated = DateTime.UtcNow
			};
			_mockHomeServiceRepository
				.Setup(repo => repo.AddAsync(It.IsAny<Core.Entities.Service>()))
				.ReturnsAsync((Core.Entities.Service service) => { service.Id = Guid.NewGuid(); return service; });
			_mockUnitOfWork
				.Setup(uow => uow.SaveChangesAsync())
				.ReturnsAsync(1);

			var result = await _homeServiceService.CreateHomeServiceAsync(userId, input);

			Assert.NotEqual(Guid.Empty, result);
			_mockHomeServiceRepository.Verify(repo => repo.AddAsync(It.IsAny<Core.Entities.Service>()), Times.Once);
			_mockUnitOfWork.Verify(uow => uow.SaveChangesAsync(), Times.Once);
		}
		[Fact]
		public async Task CreateHomeServiceAsync_WithNullInput_ShouldThrowArgumentNullException()
		{
			var userId = Guid.NewGuid();
			await Assert.ThrowsAsync<ArgumentNullException>(() => _homeServiceService.CreateHomeServiceAsync(userId, null));
		}
		[Fact]
		public async Task GetAllServiceHomePageAsync_ShouldReturnListOfHomeServiceDto()
		{
			var services = new List<Core.Entities.Service>
			{
				new Core.Entities.Service { Id = Guid.NewGuid(), Name = "Cleaning" },
				new Core.Entities.Service { Id = Guid.NewGuid(), Name = "Plumbing" }
			};
			var queryableServices = services.BuildMock();
			_mockHomeServiceRepository
				.Setup(repo => repo.GetAll())
				.Returns(queryableServices);
			var result = await _homeServiceService.GetAllServiceHomePageAsync();
			Assert.NotNull(result);
			Assert.Equal(2, result.Count());
			Assert.Contains(result, s => s.Name == "Cleaning");
			Assert.Contains(result, s => s.Name == "Plumbing");
		}
		[Fact]
		public async Task GetAllAsync_WithSearchInput_ShouldReturnFilteredPagedList()
		{
			var services = new List<Core.Entities.Service>
			{
				new Core.Entities.Service { Id = Guid.NewGuid(), Name = "Cleaning" },
				new Core.Entities.Service { Id = Guid.NewGuid(), Name = "Plumbing" },
				new Core.Entities.Service { Id = Guid.NewGuid(), Name = "Electrical" }
			};
			var queryableServices = services.BuildMock();
			_mockHomeServiceRepository
				.Setup(repo => repo.GetAll())
				.Returns(queryableServices);
			var input = new Core.Dtos.ServiceDto.HomeServiceInput
			{
				Search = "Clean",
				PageNumber = 1,
				PageSize = 10
			};
			var result = await _homeServiceService.GetAllAsync(input);
			Assert.NotNull(result);
			Assert.Single(result.Items);
			Assert.Equal("Cleaning", result.Items.First().Name);
		}
	}
}
