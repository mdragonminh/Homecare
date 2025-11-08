using HSP.Core.Dtos.AccountDto;
using HSP.Core.Dtos.WarehouseDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Service.Implementations;
using HSP.Service.Interfaces;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using System.ComponentModel.DataAnnotations;
using System.Linq.Expressions;

namespace HSP.Service.Test.Implementations
{
    public class WarehouseServiceTests
    {
        private readonly Mock<IRepository<Warehouse, Guid>> _mockWarehouseRepository;
        private readonly Mock<IRepository<Equipment, Guid>> _mockEquipmentRepository;
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IAccountManagementService> _mockAccountManagementService;
        private readonly WarehouseService _warehouseService;

        public WarehouseServiceTests()
        {
            _mockWarehouseRepository = new Mock<IRepository<Warehouse, Guid>>();
            _mockEquipmentRepository = new Mock<IRepository<Equipment, Guid>>();
            _mockUserRepository = new Mock<IUserRepository>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockAccountManagementService = new Mock<IAccountManagementService>();

            _warehouseService = new WarehouseService(
                _mockWarehouseRepository.Object,
                _mockEquipmentRepository.Object,
                _mockUserRepository.Object,
                _mockUnitOfWork.Object,
                _mockAccountManagementService.Object
            );
        }

        [Fact]
        public async Task CreateWarehouseAsync_WithValidData_ShouldCreateWarehouse()
        {
            var managerId = Guid.NewGuid();
            var createdBy = Guid.NewGuid();
            var input = new CreateWarehouseDto
            {
                Name = "Main Warehouse",
                Address = "123 Street",
                ManagerId = managerId
            };

            var manager = new AppUser { Id = managerId, FullName = "John Manager" };
            _mockUserRepository.Setup(r => r.FindByIdAsync(managerId)).ReturnsAsync(manager);

            var warehouses = new List<Warehouse>().BuildMock();
            _mockWarehouseRepository.Setup(r => r.GetAll()).Returns(warehouses);

            _mockWarehouseRepository.Setup(r => r.AddAsync(It.IsAny<Warehouse>()))
                .ReturnsAsync((Warehouse w) => w);
            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var result = await _warehouseService.CreateWarehouseAsync(input, createdBy);

            Assert.NotNull(result);
            Assert.Equal("Main Warehouse", result.Name);
            _mockWarehouseRepository.Verify(r => r.AddAsync(It.IsAny<Warehouse>()), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task CreateWarehouseAsync_WhenNameExists_ShouldThrowArgumentException()
        {
            var input = new CreateWarehouseDto { Name = "Duplicate" };
            var existing = new List<Warehouse> { new Warehouse { Name = "Duplicate" } }.BuildMock();

            _mockWarehouseRepository.Setup(r => r.GetAll()).Returns(existing);

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _warehouseService.CreateWarehouseAsync(input, Guid.NewGuid()));
        }

        [Fact]
        public async Task CreateWarehouseAsync_WhenManagerNotFound_ShouldThrowArgumentException()
        {
            var input = new CreateWarehouseDto
            {
                Name = "Warehouse 1",
                Address = "Street A",
                ManagerId = Guid.NewGuid()
            };
            var warehouses = new List<Warehouse>().BuildMock();
            _mockWarehouseRepository.Setup(r => r.GetAll()).Returns(warehouses);

            _mockUserRepository.Setup(r => r.FindByIdAsync(It.IsAny<Guid>())).ReturnsAsync((AppUser?)null);

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _warehouseService.CreateWarehouseAsync(input, Guid.NewGuid()));
        }

        [Fact]
        public async Task UpdateWarehouseAsync_WithValidData_ShouldUpdateWarehouse()
        {
            var id = Guid.NewGuid();
            var managerId = Guid.NewGuid();
            var modifiedBy = Guid.NewGuid();

            // Mock warehouse
            var warehouse = new Warehouse { Id = id, Name = "Old Name", Address = "Old Address" };

            // Mock warehouse data
            var warehouses = new List<Warehouse> { warehouse }.BuildMock();
            _mockWarehouseRepository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(warehouse);
            _mockWarehouseRepository.Setup(r => r.GetAll()).Returns(warehouses);

            // Mock manager
            _mockUserRepository.Setup(r => r.FindByIdAsync(managerId))
                .ReturnsAsync(new AppUser { Id = managerId, FullName = "Updated Manager" });

            // Mock equipments for CountAsync()
            var equipments = new List<Equipment>
    {
        new Equipment { Id = Guid.NewGuid(), WarehouseId = id, IsDeleted = false },
        new Equipment { Id = Guid.NewGuid(), WarehouseId = id, IsDeleted = true }
    }.BuildMock(); // ✅ hỗ trợ async LINQ

            _mockEquipmentRepository.Setup(r => r.GetAll()).Returns(equipments);

            // Mock save
            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            // Input
            var input = new UpdateWarehouseDto
            {
                Name = "New Name",
                Address = "New Address",
                ManagerId = managerId
            };

            // Act
            var result = await _warehouseService.UpdateWarehouseAsync(id, input, modifiedBy);

            // Assert
            Assert.Equal("New Name", result.Name);
            Assert.Equal("New Address", result.Address);
            Assert.Equal("Updated Manager", result.ManagerName);
            Assert.Equal(1, result.TotalEquipments); // chỉ 1 equipment không bị IsDeleted

            _mockWarehouseRepository.Verify(r => r.Update(It.IsAny<Warehouse>()), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }


        [Fact]
        public async Task UpdateWarehouseAsync_WhenNotFound_ShouldThrowArgumentException()
        {
            _mockWarehouseRepository.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Warehouse?)null);
            await Assert.ThrowsAsync<ArgumentException>(() =>
                _warehouseService.UpdateWarehouseAsync(Guid.NewGuid(), new UpdateWarehouseDto(), Guid.NewGuid()));
        }

        [Fact]
        public async Task DeleteWarehouseAsync_WhenValid_ShouldSoftDeleteAndReturnTrue()
        {
            var id = Guid.NewGuid();
            var warehouse = new Warehouse { Id = id };
            var equipments = new List<Equipment>().BuildMock();

            _mockWarehouseRepository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(warehouse);
            _mockEquipmentRepository.Setup(r => r.GetAll()).Returns(equipments);
            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var result = await _warehouseService.DeleteWarehouseAsync(id);

            Assert.True(result);
            _mockWarehouseRepository.Verify(r => r.SoftDelete(It.IsAny<Warehouse>()), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task DeleteWarehouseAsync_WhenWarehouseHasEquipments_ShouldThrowInvalidOperationException()
        {
            var id = Guid.NewGuid();
            var warehouse = new Warehouse { Id = id };
            var equipments = new List<Equipment>
            {
                new Equipment { Id = Guid.NewGuid(), WarehouseId = id, IsDeleted = false }
            }.BuildMock();

            _mockWarehouseRepository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(warehouse);
            _mockEquipmentRepository.Setup(r => r.GetAll()).Returns(equipments);

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _warehouseService.DeleteWarehouseAsync(id));
        }

        [Fact]
        public async Task GetWarehouseByIdAsync_WithValidId_ShouldReturnWarehouseDetailDto()
        {
            var id = Guid.NewGuid();
            var warehouse = new Warehouse
            {
                Id = id,
                Name = "Central Warehouse",
                Address = "123 St",
                Manager = new AppUser { FullName = "John Manager" },
                Equipments = new List<Equipment>
        {
            new Equipment { Id = Guid.NewGuid(), Name = "Tool A", IsDeleted = false }
        }
            };

            // ✅ Tạo IQueryable có hỗ trợ async
            var warehouses = new List<Warehouse> { warehouse }.BuildMock();

            _mockWarehouseRepository.Setup(r => r.GetAll(It.IsAny<Expression<Func<Warehouse, object>>[]>()))
                .Returns(warehouses);

            // Act
            var result = await _warehouseService.GetWarehouseByIdAsync(id);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Central Warehouse", result.Name);
            Assert.Single(result.Equipments);
        }

        [Fact]
        public async Task GetWarehouseByIdAsync_WhenNotFound_ShouldReturnNull()
        {
            // Arrange
            var data = new List<Warehouse>(); // Trống => không có warehouse nào
            var mockQueryable = data.BuildMock(); // Tạo IQueryable có IAsyncQueryProvider

            _mockWarehouseRepository
                .Setup(r => r.GetAll(It.IsAny<Expression<Func<Warehouse, object>>[]>()))
                .Returns(mockQueryable);

            // Act
            var result = await _warehouseService.GetWarehouseByIdAsync(Guid.NewGuid());

            // Assert
            Assert.Null(result);
        }



        [Fact]
        public async Task GetAllWarehousesAsync_ShouldReturnAllWarehouses()
        {
            // Arrange
            var warehouses = new List<Warehouse>
    {
        new Warehouse
        {
            Id = Guid.NewGuid(),
            Name = "W1",
            Address = "123 Street",
            Manager = new AppUser { FullName = "M1" },
            Equipments = new List<Equipment>{ new Equipment { IsDeleted = false } }
        },
        new Warehouse
        {
            Id = Guid.NewGuid(),
            Name = "W2",
            Address = "456 Avenue",
            Manager = new AppUser { FullName = "M2" },
            Equipments = new List<Equipment>()
        }
    }.BuildMock(); // 👈 dùng BuildMockAsync để hỗ trợ ToListAsync()

            _mockWarehouseRepository
                .Setup(r => r.GetAll(It.IsAny<Expression<Func<Warehouse, object>>[]>()))
                .Returns(warehouses);

            // Act
            var result = await _warehouseService.GetAllWarehousesAsync();

            // Assert
            Assert.Equal(2, result.Count);
            Assert.Contains(result, r => r.Name == "W1");
        }


        [Fact]
        public async Task IsWarehouseNameUniqueAsync_WhenDuplicateExists_ShouldReturnFalse()
        {
            var warehouses = new List<Warehouse> { new Warehouse { Name = "Duplicate" } }.BuildMock();
            _mockWarehouseRepository.Setup(r => r.GetAll()).Returns(warehouses);

            var result = await _warehouseService.IsWarehouseNameUniqueAsync("Duplicate");

            Assert.False(result);
        }

        [Fact]
        public async Task IsWarehouseNameUniqueAsync_WhenUnique_ShouldReturnTrue()
        {
            var warehouses = new List<Warehouse>().BuildMock();
            _mockWarehouseRepository.Setup(r => r.GetAll()).Returns(warehouses);

            var result = await _warehouseService.IsWarehouseNameUniqueAsync("Unique");
            Assert.True(result);
        }
    }
}
