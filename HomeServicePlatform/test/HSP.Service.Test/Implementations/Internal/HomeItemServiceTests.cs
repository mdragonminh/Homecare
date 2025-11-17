using HSP.Core.Dtos.HomeItemDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Implementations.Internal;
using Microsoft.Extensions.Localization;
using MockQueryable;
using Moq;
using System.ComponentModel.DataAnnotations;
using System.Linq.Expressions;

namespace HSP.Service.Test.Implementations.External
{
	public class HomeItemServiceTests
	{
		private readonly Mock<IRepository<HomeItem, Guid>> _homeItemRepoMock;
		private readonly Mock<IRepository<Home, Guid>> _homeRepoMock;
		private readonly Mock<IUnitOfWork> _unitOfWorkMock;
		private readonly Mock<IStringLocalizer<SharedResource>> _localizerMock;
		private readonly HomeItemService _service;

		public HomeItemServiceTests()
		{
			_homeItemRepoMock = new Mock<IRepository<HomeItem, Guid>>();
			_homeRepoMock = new Mock<IRepository<Home, Guid>>();
			_unitOfWorkMock = new Mock<IUnitOfWork>();
			_localizerMock = new Mock<IStringLocalizer<SharedResource>>();

			_service = new HomeItemService(
				_homeItemRepoMock.Object,
				_homeRepoMock.Object,
				_unitOfWorkMock.Object,
				_localizerMock.Object
			);
		}

		[Fact]
		public async Task CreateHomeItemAsync_WithValidOwnership_ShouldCreateAndReturnId()
		{
			var homeId = Guid.NewGuid();
			var userId = Guid.NewGuid();
			var input = new CreateHomeItemDto { HomeId = homeId, Name = "TV" };

			var homes = new List<Home>
						{
								new Home { Id = homeId, CustomerProfile = new AppUser { Id = userId } }
						}.BuildMock();

			_homeRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Home, object>>[]>()))
									 .Returns(homes);

			_homeItemRepoMock.Setup(r => r.AddAsync(It.IsAny<HomeItem>()))
											 .ReturnsAsync((HomeItem h) => { h.Id = Guid.NewGuid(); return h; });

			_unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

			var result = await _service.CreateHomeItemAsync(input, userId);

			Assert.NotEqual(Guid.Empty, result);
			_homeItemRepoMock.Verify(r => r.AddAsync(It.IsAny<HomeItem>()), Times.Once);
			_unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
		}
		[Fact]
		public async Task CreateHomeItemAsync_WithInvalidOwnership_ShouldThrowUnauthorizedAccessException()
		{
			var homeId = Guid.NewGuid();
			var userId = Guid.NewGuid();

			var homes = new List<Home>().BuildMock();
			_homeRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<Home, object>>[]>()))
									 .Returns(homes);

			await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
					_service.CreateHomeItemAsync(new CreateHomeItemDto { HomeId = homeId, Name = "TV" }, userId));
		}

		[Fact]
		public async Task CreateHomeItemAsync_WithNullInput_ShouldThrowArgumentException()
		{
			await Assert.ThrowsAsync<ArgumentException>(() =>
				_service.CreateHomeItemAsync(null!, Guid.NewGuid()));
		}


		[Fact]
		public async Task DeleteHomeItemAsync_WithValidOwnership_ShouldDeleteAndReturnTrue()
		{
			var id = Guid.NewGuid();
			var userId = Guid.NewGuid();
			var item = new HomeItem
			{
				Id = id,
				Home = new Home { CustomerProfile = new AppUser { Id = userId } }
			};

			var items = new List<HomeItem> { item }.BuildMock();
			_homeItemRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<HomeItem, object>>[]>()))
				.Returns(items);

			_homeItemRepoMock.Setup(r => r.DeleteAsync(id)).Returns(Task.CompletedTask);
			_unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

			var result = await _service.DeleteHomeItemAsync(id, userId);

			Assert.True(result);
			_homeItemRepoMock.Verify(r => r.DeleteAsync(id), Times.Once);
			_unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
		}

		[Fact]
		public async Task DeleteHomeItemAsync_WithInvalidOwnership_ShouldThrowValidationException()
		{
			var id = Guid.NewGuid();
			var userId = Guid.NewGuid();

			var item = new HomeItem
			{
				Id = id,
				Home = new Home { CustomerProfile = new AppUser { Id = Guid.NewGuid() } }
			};

			var items = new List<HomeItem> { item }.BuildMock();
			_homeItemRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<HomeItem, object>>[]>()))
				.Returns(items);

			await Assert.ThrowsAsync<ValidationException>(() =>
				_service.DeleteHomeItemAsync(id, userId));
		}

		[Fact]
		public async Task UpdateHomeItemAsync_WithValidOwnership_ShouldUpdateAndReturnTrue()
		{
			var id = Guid.NewGuid();
			var userId = Guid.NewGuid();

			var item = new HomeItem
			{
				Id = id,
				Name = "Old TV",
				Home = new Home { CustomerProfile = new AppUser { Id = userId } }
			};

			var input = new UpdateHomeItemDto
			{
				Name = "Updated TV",
				Brand = "Samsung"
			};

			var items = new List<HomeItem> { item }.BuildMock();
			_homeItemRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<HomeItem, object>>[]>()))
				.Returns(items);

			_unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

			var result = await _service.UpdateHomeItemAsync(id, input, userId);

			Assert.True(result);
			Assert.Equal("Updated TV", item.Name);
			Assert.Equal("Samsung", item.Brand);
		}

		[Fact]
		public async Task UpdateHomeItemAsync_WithInvalidOwnership_ShouldThrowValidationException()
		{
			var id = Guid.NewGuid();
			var userId = Guid.NewGuid();

			var item = new HomeItem
			{
				Id = id,
				Home = new Home { CustomerProfile = new AppUser { Id = Guid.NewGuid() } }
			};

			var items = new List<HomeItem> { item }.BuildMock();
			_homeItemRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<HomeItem, object>>[]>()))
				.Returns(items);

			await Assert.ThrowsAsync<ValidationException>(() =>
				_service.UpdateHomeItemAsync(id, new UpdateHomeItemDto { Name = "x" }, userId));
		}

		[Fact]
		public async Task GetHomeItemByIdAsync_WithValidOwnership_ShouldReturnHomeItemDto()
		{
			var id = Guid.NewGuid();
			var userId = Guid.NewGuid();

			var item = new HomeItem
			{
				Id = id,
				Name = "TV",
				HomeId = Guid.NewGuid(),
				Home = new Home { CustomerProfile = new AppUser { Id = userId } }
			};

			var items = new List<HomeItem> { item }.BuildMock();
			_homeItemRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<HomeItem, object>>[]>()))
				.Returns(items);

			var result = await _service.GetHomeItemByIdAsync(id, userId);

			Assert.NotNull(result);
			Assert.Equal("TV", result.Name);
		}

		[Fact]
		public async Task GetHomeItemByIdAsync_WithInvalidOwnership_ShouldThrowValidationException()
		{
			var id = Guid.NewGuid();
			var userId = Guid.NewGuid();

			var item = new HomeItem
			{
				Id = id,
				Home = new Home { CustomerProfile = new AppUser { Id = Guid.NewGuid() } }
			};

			var items = new List<HomeItem> { item }.BuildMock();
			_homeItemRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<HomeItem, object>>[]>()))
				.Returns(items);

			await Assert.ThrowsAsync<ValidationException>(() =>
				_service.GetHomeItemByIdAsync(id, userId));
		}

		[Fact]
		public async Task GetAllHomeItemsAsync_WithValidOwnership_ShouldReturnPagedList()
		{
			var homeId = Guid.NewGuid();
			var userId = Guid.NewGuid();

			var items = new List<HomeItem>
						{
								new HomeItem
								{
										Id = Guid.NewGuid(),
										Name = "TV",
										Brand = "LG",
										HomeId = homeId,
										Home = new Home { CustomerProfile = new AppUser { Id = userId } }
								},
								new HomeItem
								{
										Id = Guid.NewGuid(),
										Name = "Fridge",
										Brand = "Samsung",
										HomeId = homeId,
										Home = new Home { CustomerProfile = new AppUser { Id = userId } }
								}
						}.BuildMock();

			_homeItemRepoMock.Setup(r => r.GetAll(It.IsAny<Expression<Func<HomeItem, object>>[]>()))
											 .Returns(items);

			var input = new HomeItemInput { PageNumber = 1, PageSize = 10 };

			var result = await _service.GetAllHomeItemsAsync(input, homeId, userId);

			Assert.NotNull(result);
			Assert.Equal(2, result.Items.Count);
			Assert.Contains(result.Items, x => x.Name == "TV");
			Assert.Contains(result.Items, x => x.Name == "Fridge");
		}
	}
}
