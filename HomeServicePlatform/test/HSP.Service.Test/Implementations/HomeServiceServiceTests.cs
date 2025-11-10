using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Implementations;
using Microsoft.EntityFrameworkCore;
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
		[Fact]
		public async Task GetHomeServiceByIdAsync_WithValidId_ShouldReturnHomeServiceDto()
		{
			var serviceId = Guid.NewGuid();
			var existingService = new Core.Entities.Service
			{
				Id = serviceId,
				Name = "Cleaning",
				Description = "House cleaning service",
				Price = 5000
			};
			_mockHomeServiceRepository
				.Setup(repo => repo.GetByIdAsync(serviceId))
				.ReturnsAsync(existingService);
			var result = await _homeServiceService.GetHomeServiceByIdAsync(serviceId);
			Assert.NotNull(result);
			Assert.Equal(serviceId, result.Id);
			Assert.Equal("Cleaning", result.Name);
		}
		[Fact]
		public async Task GetHomeServiceByIdAsync_WithInvalidId_ShouldThrowKeyNotFoundException()
		{
			var serviceId = Guid.NewGuid();
			_mockHomeServiceRepository.Setup(repo => repo.GetByIdAsync(serviceId))
				.ReturnsAsync((Core.Entities.Service)null);
			await Assert.ThrowsAsync<KeyNotFoundException>(() => _homeServiceService.GetHomeServiceByIdAsync(serviceId));
		}
		[Fact]
		public async Task UpdateHomeServiceAsync_WithValidInput_ShouldUpdateServiceAndReturnTrue()
		{
			var userId = Guid.NewGuid();
			var serviceId = Guid.NewGuid();
			var existingService = new Core.Entities.Service
			{
				Id = serviceId,
				Name = "Old Name",
				Description = "Old Description",
				Price = 5000,
				DateCreated = DateTime.UtcNow.AddDays(-1),
				CreatedBy = userId
			};
			_mockHomeServiceRepository
				.Setup(repo => repo.GetAll())
				.Returns(new List<Core.Entities.Service> { existingService }.BuildMock());
			var input = new Core.Dtos.ServiceDto.UpdateHomeServiceDto
			{
				Name = "New Name",
				Description = "New Description",
				Price = 10000
			};
			var result = await _homeServiceService.UpdateHomeServiceAsync(userId, serviceId, input);
			Assert.True(result);
			Assert.Equal("New Name", existingService.Name);
			Assert.Equal("New Description", existingService.Description);
			_mockUnitOfWork.Verify(uow => uow.SaveChangesAsync(), Times.Once);
		}
		[Fact]
		public async Task UpdateHomeServiceAsync_WithNullInput_ShouldThrowArgumentNullException()
		{
			var userId = Guid.NewGuid();
			var serviceId = Guid.NewGuid();
			await Assert.ThrowsAsync<ArgumentNullException>(() => _homeServiceService.UpdateHomeServiceAsync(userId, serviceId, null));
		}
		[Fact]
		public async Task UpdateHomeServiceAsync_WithInvalidHomeServiceId_ShouldThrowKeyNotFoundException()
		{
			var userId = Guid.NewGuid();
			var serviceId = Guid.NewGuid();
			_mockHomeServiceRepository
				.Setup(repo => repo.GetAll())
				.Returns(new List<Core.Entities.Service>().BuildMock());
			var input = new Core.Dtos.ServiceDto.UpdateHomeServiceDto
			{
				Name = "New Name",
				Description = "New Description",
				Price = 100000,
			};
			await Assert.ThrowsAsync<KeyNotFoundException>(() => _homeServiceService.UpdateHomeServiceAsync(userId, serviceId, input));
		}
		[Fact]
		public async Task DeleteHomeServiceAsync_DeleteSuccess_ShouldDeleteAndReturnTrue()
		{
			var userId = Guid.NewGuid();
			var existingService = new Core.Entities.Service
			{
				Id = Guid.NewGuid(),
				Name = "Service to Delete",
				Description = "Description",
				Price = 5000
			};
			var services = new List<Core.Entities.Service> { existingService }.BuildMock();

			_mockHomeServiceRepository
					.Setup(repo => repo.GetAll())
					.Returns(services);
			_mockUnitOfWork
				.Setup(uow => uow.SaveChangesAsync())
				.ReturnsAsync(1);
			var result = await _homeServiceService.DeleteHomeServiceAsync(existingService.Id);
			Assert.True(result);
			_mockHomeServiceRepository.Verify(repo => repo.DeleteAsync(existingService.Id), Times.Once);
			_mockUnitOfWork.Verify(uow => uow.SaveChangesAsync(), Times.Once);
		}
		[Fact]
		public async Task DeleteHomeServiceAsync_NonExistentService_ShouldThrowKeyNotFoundException()
		{
			var userId = Guid.NewGuid();
			var nonExistentServiceId = Guid.NewGuid();
			var emptyServices = new List<Core.Entities.Service>().BuildMock();
			_mockHomeServiceRepository
					.Setup(repo => repo.GetAll())
					.Returns(emptyServices);
			await Assert.ThrowsAsync<KeyNotFoundException>(() => _homeServiceService.DeleteHomeServiceAsync(nonExistentServiceId));
		}
		[Fact]
		public async Task DeleteHomeServiceAsync_ServiceInUse_ThrowInvalidOperationException()
		{
			var userId = Guid.NewGuid();
			var serviceId = Guid.NewGuid();

			var existingService = new Core.Entities.Service
			{
				Id = serviceId,
				Name = "In-use Service",
				Technicians = new List<TechnicianProfile>
				{
						new TechnicianProfile { ApprovalStatus = Core.Enums.TechnicianApprovalStatus.Approved }
				}
			};

			var services = new List<Core.Entities.Service> { existingService }
					.BuildMock();

			_mockHomeServiceRepository.Setup(r => r.GetAll())
					.Returns(services);

			await Assert.ThrowsAsync<InvalidOperationException>(() =>
					_homeServiceService.DeleteHomeServiceAsync(serviceId));

			_mockHomeServiceRepository.Verify(r => r.DeleteAsync(It.IsAny<Guid>()), Times.Never);
			_mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
		}
	}
}
