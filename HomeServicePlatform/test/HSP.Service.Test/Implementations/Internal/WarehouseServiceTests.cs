using HSP.Core.Constans;
using HSP.Core.Dtos.AccountDto;
using HSP.Core.Dtos.WarehouseDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Service.Implementations.Internal;
using HSP.Service.Interfaces;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using System.ComponentModel.DataAnnotations;
using System.Linq.Expressions;

namespace HSP.Service.Test.Implementations.Internal
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
        public async Task CreateWarehouseAsync_WithoutManagerId_ShouldCreateWarehouseWithoutManager()
        {
            // Arrange
            var createdBy = Guid.NewGuid();
            var input = new CreateWarehouseDto
            {
                Name = "New Warehouse",
                Address = "123 Street",
                ManagerId = null
            };

            var warehouses = new List<Warehouse>().BuildMock();
            _mockWarehouseRepository.Setup(r => r.GetAll()).Returns(warehouses);
            _mockWarehouseRepository.Setup(r => r.AddAsync(It.IsAny<Warehouse>()))
                .ReturnsAsync((Warehouse w) => w);
            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _warehouseService.CreateWarehouseAsync(input, createdBy);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("New Warehouse", result.Name);
            Assert.Null(result.ManagerId);
            Assert.Null(result.ManagerName);
            Assert.Equal(0, result.TotalEquipments);
            _mockUserRepository.Verify(r => r.FindByIdAsync(It.IsAny<Guid>()), Times.Never);
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
        public async Task UpdateWarehouseAsync_WhenNameDuplicatesOtherWarehouse_ShouldThrowArgumentException()
        {
            // Arrange
            var id = Guid.NewGuid();
            var otherWarehouseId = Guid.NewGuid();

            var warehouse = new Warehouse { Id = id, Name = "Old Name" };
            var warehouses = new List<Warehouse>
            {
                warehouse,
                new Warehouse { Id = otherWarehouseId, Name = "Duplicate Name" }
            }.BuildMock();

            _mockWarehouseRepository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(warehouse);
            _mockWarehouseRepository.Setup(r => r.GetAll()).Returns(warehouses);

            var input = new UpdateWarehouseDto
            {
                Name = "Duplicate Name",
                Address = "Address"
            };

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() =>
                _warehouseService.UpdateWarehouseAsync(id, input, Guid.NewGuid()));
        }

        [Fact]
        public async Task UpdateWarehouseAsync_WithoutManagerId_ShouldUpdateWithoutManager()
        {
            // Arrange
            var id = Guid.NewGuid();
            var modifiedBy = Guid.NewGuid();

            var warehouse = new Warehouse { Id = id, Name = "Old Name", Address = "Old Address" };
            var warehouses = new List<Warehouse> { warehouse }.BuildMock();

            _mockWarehouseRepository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(warehouse);
            _mockWarehouseRepository.Setup(r => r.GetAll()).Returns(warehouses);

            var equipments = new List<Equipment>().BuildMock();
            _mockEquipmentRepository.Setup(r => r.GetAll()).Returns(equipments);
            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var input = new UpdateWarehouseDto
            {
                Name = "New Name",
                Address = "New Address",
                ManagerId = null
            };

            // Act
            var result = await _warehouseService.UpdateWarehouseAsync(id, input, modifiedBy);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("New Name", result.Name);
            Assert.Null(result.ManagerId);
            Assert.Null(result.ManagerName);
            _mockUserRepository.Verify(r => r.FindByIdAsync(It.IsAny<Guid>()), Times.Never);
        }

        [Fact]
        public async Task UpdateWarehouseAsync_WhenManagerNotFound_ShouldThrowArgumentException()
        {
            // Arrange
            var id = Guid.NewGuid();
            var warehouse = new Warehouse { Id = id, Name = "Old Name" };
            var warehouses = new List<Warehouse> { warehouse }.BuildMock();

            _mockWarehouseRepository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(warehouse);
            _mockWarehouseRepository.Setup(r => r.GetAll()).Returns(warehouses);
            _mockUserRepository.Setup(r => r.FindByIdAsync(It.IsAny<Guid>())).ReturnsAsync((AppUser?)null);

            var input = new UpdateWarehouseDto
            {
                Name = "New Name",
                Address = "New Address",
                ManagerId = Guid.NewGuid()
            };

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() =>
                _warehouseService.UpdateWarehouseAsync(id, input, Guid.NewGuid()));
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
        public async Task DeleteWarehouseAsync_WhenNotFound_ShouldReturnFalse()
        {
            // Arrange
            _mockWarehouseRepository.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((Warehouse?)null);

            // Act
            var result = await _warehouseService.DeleteWarehouseAsync(Guid.NewGuid());

            // Assert
            Assert.False(result);
            _mockWarehouseRepository.Verify(r => r.SoftDelete(It.IsAny<Warehouse>()), Times.Never);
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
        public async Task GetWarehouseByIdAsync_WithNullManager_ShouldReturnNullManagerInfo()
        {
            // Arrange
            var id = Guid.NewGuid();
            var warehouse = new Warehouse
            {
                Id = id,
                Name = "Warehouse",
                Address = "123 St",
                Manager = null,
                ManagerId = null,
                Equipments = new List<Equipment>()
            };

            var warehouses = new List<Warehouse> { warehouse }.BuildMock();

            _mockWarehouseRepository
                .Setup(r => r.GetAll(It.IsAny<Expression<Func<Warehouse, object>>[]>()))
                .Returns(warehouses);

            // Act
            var result = await _warehouseService.GetWarehouseByIdAsync(id);

            // Assert
            Assert.NotNull(result);
            Assert.Null(result.ManagerName);
            Assert.Null(result.ManagerEmail);
        }

        [Fact]
        public async Task GetWarehouseByIdAsync_ShouldExcludeDeletedEquipments()
        {
            // Arrange
            var id = Guid.NewGuid();
            var warehouse = new Warehouse
            {
                Id = id,
                Name = "Warehouse",
                Address = "123 St",
                Manager = new AppUser { FullName = "Manager" },
                Equipments = new List<Equipment>
                {
                    new Equipment { Id = Guid.NewGuid(), Name = "Active", IsDeleted = false },
                    new Equipment { Id = Guid.NewGuid(), Name = "Deleted", IsDeleted = true }
                }
            };

            var warehouses = new List<Warehouse> { warehouse }.BuildMock();

            _mockWarehouseRepository
                .Setup(r => r.GetAll(It.IsAny<Expression<Func<Warehouse, object>>[]>()))
                .Returns(warehouses);

            // Act
            var result = await _warehouseService.GetWarehouseByIdAsync(id);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result.Equipments);
            Assert.Equal("Active", result.Equipments[0].Name);
        }



        [Fact]
        public async Task GetWarehousesAsync_ShouldReturnAllWarehouses()
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
        public async Task GetWarehousesAsync_WithoutSearchTerm_ShouldReturnPagedList()
        {
            // Arrange
            var warehouses = new List<Warehouse>
            {
                new Warehouse
                {
                    Id = Guid.NewGuid(),
                    Name = "Warehouse 1",
                    Address = "Address 1",
                    Manager = new AppUser { FullName = "Manager 1" },
                    Equipments = new List<Equipment>
                    {
                        new Equipment { IsDeleted = false },
                        new Equipment { IsDeleted = false }
                    },
                    DateCreated = DateTime.UtcNow
                },
                new Warehouse
                {
                    Id = Guid.NewGuid(),
                    Name = "Warehouse 2",
                    Address = "Address 2",
                    Manager = new AppUser { FullName = "Manager 2" },
                    Equipments = new List<Equipment>
                    {
                        new Equipment { IsDeleted = false }
                    },
                    DateCreated = DateTime.UtcNow.AddDays(-1)
                }
            }.BuildMock();

            _mockWarehouseRepository
                .Setup(r => r.GetAll(It.IsAny<Expression<Func<Warehouse, object>>[]>()))
                .Returns(warehouses);

            // Act
            var result = await _warehouseService.GetWarehousesAsync(page: 1, pageSize: 10);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
            Assert.Equal(2, result.Items.Count);
        }

        [Fact]
        public async Task GetWarehousesAsync_WithSearchTermMatchingName_ShouldReturnFilteredResults()
        {
            // Arrange
            var warehouses = new List<Warehouse>
            {
                new Warehouse
                {
                    Id = Guid.NewGuid(),
                    Name = "Central Warehouse",
                    Address = "123 Street",
                    Manager = new AppUser { FullName = "Manager 1" },
                    Equipments = new List<Equipment>(),
                    DateCreated = DateTime.UtcNow
                },
                new Warehouse
                {
                    Id = Guid.NewGuid(),
                    Name = "East Warehouse",
                    Address = "456 Avenue",
                    Manager = new AppUser { FullName = "Manager 2" },
                    Equipments = new List<Equipment>(),
                    DateCreated = DateTime.UtcNow
                }
            }.BuildMock();

            _mockWarehouseRepository
                .Setup(r => r.GetAll(It.IsAny<Expression<Func<Warehouse, object>>[]>()))
                .Returns(warehouses);

            // Act
            var result = await _warehouseService.GetWarehousesAsync(page: 1, pageSize: 10, searchTerm: "Central");

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Contains(result.Items, w => w.Name == "Central Warehouse");
        }

        [Fact]
        public async Task GetWarehousesAsync_WithSearchTermMatchingAddress_ShouldReturnFilteredResults()
        {
            // Arrange
            var warehouses = new List<Warehouse>
            {
                new Warehouse
                {
                    Id = Guid.NewGuid(),
                    Name = "Warehouse A",
                    Address = "123 Main Street",
                    Manager = new AppUser { FullName = "Manager 1" },
                    Equipments = new List<Equipment>(),
                    DateCreated = DateTime.UtcNow
                },
                new Warehouse
                {
                    Id = Guid.NewGuid(),
                    Name = "Warehouse B",
                    Address = "456 Side Avenue",
                    Manager = new AppUser { FullName = "Manager 2" },
                    Equipments = new List<Equipment>(),
                    DateCreated = DateTime.UtcNow
                }
            }.BuildMock();

            _mockWarehouseRepository
                .Setup(r => r.GetAll(It.IsAny<Expression<Func<Warehouse, object>>[]>()))
                .Returns(warehouses);

            // Act
            var result = await _warehouseService.GetWarehousesAsync(page: 1, pageSize: 10, searchTerm: "Main");

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Contains(result.Items, w => w.Address.Contains("Main"));
        }

        [Fact]
        public async Task GetWarehousesAsync_WithNullAddress_ShouldNotThrowException()
        {
            // Arrange
            var warehouses = new List<Warehouse>
            {
                new Warehouse
                {
                    Id = Guid.NewGuid(),
                    Name = "Warehouse 1",
                    Address = null,
                    Manager = new AppUser { FullName = "Manager 1" },
                    Equipments = new List<Equipment>(),
                    DateCreated = DateTime.UtcNow
                }
            }.BuildMock();

            _mockWarehouseRepository
                .Setup(r => r.GetAll(It.IsAny<Expression<Func<Warehouse, object>>[]>()))
                .Returns(warehouses);

            // Act
            var result = await _warehouseService.GetWarehousesAsync(page: 1, pageSize: 10, searchTerm: "test");

            // Assert
            Assert.NotNull(result);
            Assert.Equal(0, result.TotalCount);
        }

        [Fact]
        public async Task GetWarehousesAsync_WithNullManager_ShouldReturnNullManagerName()
        {
            // Arrange
            var warehouses = new List<Warehouse>
            {
                new Warehouse
                {
                    Id = Guid.NewGuid(),
                    Name = "Warehouse 1",
                    Address = "123 Street",
                    Manager = null,
                    Equipments = new List<Equipment>(),
                    DateCreated = DateTime.UtcNow
                }
            }.BuildMock();

            _mockWarehouseRepository
                .Setup(r => r.GetAll(It.IsAny<Expression<Func<Warehouse, object>>[]>()))
                .Returns(warehouses);

            // Act
            var result = await _warehouseService.GetWarehousesAsync(page: 1, pageSize: 10);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result.Items);
            Assert.Null(result.Items[0].ManagerName);
        }

        [Fact]
        public async Task GetWarehousesAsync_ShouldExcludeDeletedEquipments()
        {
            // Arrange
            var warehouses = new List<Warehouse>
            {
                new Warehouse
                {
                    Id = Guid.NewGuid(),
                    Name = "Warehouse 1",
                    Address = "123 Street",
                    Manager = new AppUser { FullName = "Manager 1" },
                    Equipments = new List<Equipment>
                    {
                        new Equipment { IsDeleted = false },
                        new Equipment { IsDeleted = true },
                        new Equipment { IsDeleted = false }
                    },
                    DateCreated = DateTime.UtcNow
                }
            }.BuildMock();

            _mockWarehouseRepository
                .Setup(r => r.GetAll(It.IsAny<Expression<Func<Warehouse, object>>[]>()))
                .Returns(warehouses);

            // Act
            var result = await _warehouseService.GetWarehousesAsync(page: 1, pageSize: 10);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result.Items);
            Assert.Equal(2, result.Items[0].TotalEquipments); // Chỉ đếm equipment không bị xóa
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

        [Fact]
        public async Task IsWarehouseNameUniqueAsync_WhenExcludingCurrentWarehouse_ShouldReturnTrue()
        {
            // Arrange
            var currentId = Guid.NewGuid();
            var warehouses = new List<Warehouse>
            {
                new Warehouse { Id = currentId, Name = "Warehouse A" }
            }.BuildMock();

            _mockWarehouseRepository.Setup(r => r.GetAll()).Returns(warehouses);

            // Act
            var result = await _warehouseService.IsWarehouseNameUniqueAsync("Warehouse A", currentId);

            // Assert
            Assert.True(result); // Vì đang exclude chính warehouse này
        }

        [Fact]
        public async Task IsWarehouseNameUniqueAsync_WhenDuplicateExistsButExcluded_ShouldReturnTrue()
        {
            // Arrange
            var excludeId = Guid.NewGuid();
            var otherId = Guid.NewGuid();
            var warehouses = new List<Warehouse>
            {
                new Warehouse { Id = excludeId, Name = "Test" },
                new Warehouse { Id = otherId, Name = "Other" }
            }.BuildMock();

            _mockWarehouseRepository.Setup(r => r.GetAll()).Returns(warehouses);

            // Act
            var result = await _warehouseService.IsWarehouseNameUniqueAsync("Test", excludeId);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task WarehouseExistsAsync_WhenExists_ShouldReturnTrue()
        {
            // Arrange
            var id = Guid.NewGuid();
            _mockWarehouseRepository.Setup(r => r.AnyAsync(It.IsAny<Expression<Func<Warehouse, bool>>>()))
                .ReturnsAsync(true);

            // Act
            var result = await _warehouseService.WarehouseExistsAsync(id);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task WarehouseExistsAsync_WhenNotExists_ShouldReturnFalse()
        {
            // Arrange
            var id = Guid.NewGuid();
            _mockWarehouseRepository.Setup(r => r.AnyAsync(It.IsAny<Expression<Func<Warehouse, bool>>>()))
                .ReturnsAsync(false);

            // Act
            var result = await _warehouseService.WarehouseExistsAsync(id);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task GetWarehouseManagersAsync_ShouldReturnOperatorsAndEquipmentManagers()
        {
            // Arrange
            var operators = new List<AccountResponseDto>
            {
                new AccountResponseDto
                {
                    Id = Guid.NewGuid().ToString(),
                    Email = "operator1@test.com",
                    Username = "operator1",
                    FullName = "Operator One",
                    PhoneNumber = "123456789",
                    Role = RoleNames.Operator,
                    Department = "Operations",
                    IsActive = true,
                    EmailConfirmed = true,
                    CreatedAt = DateTime.UtcNow,
                    LastLoginAt = DateTime.UtcNow,
                    CreatedBy = "admin"
                }
            };

            var eqManagers = new List<AccountResponseDto>
            {
                new AccountResponseDto
                {
                    Id = Guid.NewGuid().ToString(),
                    Email = "eqmanager1@test.com",
                    Username = "eqmanager1",
                    FullName = "Equipment Manager One",
                    PhoneNumber = "987654321",
                    Role = RoleNames.EquipmentManager,
                    Department = "Equipment",
                    IsActive = true,
                    EmailConfirmed = true,
                    CreatedAt = DateTime.UtcNow,
                    LastLoginAt = DateTime.UtcNow,
                    CreatedBy = "admin"
                }
            };

            _mockAccountManagementService
                .Setup(s => s.GetAccountsByRoleAsync(RoleNames.Operator))
                .ReturnsAsync(operators);

            _mockAccountManagementService
                .Setup(s => s.GetAccountsByRoleAsync(RoleNames.EquipmentManager))
                .ReturnsAsync(eqManagers);

            // Act
            var result = await _warehouseService.GetWarehouseManagersAsync();

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Equal(2, resultList.Count);
            Assert.Contains(resultList, u => u.Role == RoleNames.Operator);
            Assert.Contains(resultList, u => u.Role == RoleNames.EquipmentManager);
        }

        [Fact]
        public async Task GetWarehouseManagersAsync_WithDuplicateIds_ShouldReturnDistinctManagers()
        {
            // Arrange
            var duplicateId = Guid.NewGuid().ToString();
            var operators = new List<AccountResponseDto>
            {
                new AccountResponseDto
                {
                    Id = duplicateId,
                    Email = "manager@test.com",
                    Username = "manager",
                    FullName = "Manager",
                    Role = RoleNames.Operator,
                    IsActive = true,
                    EmailConfirmed = true,
                    CreatedAt = DateTime.UtcNow
                }
            };

            var eqManagers = new List<AccountResponseDto>
            {
                new AccountResponseDto
                {
                    Id = duplicateId, // Same ID
                    Email = "manager@test.com",
                    Username = "manager",
                    FullName = "Manager",
                    Role = RoleNames.EquipmentManager,
                    IsActive = true,
                    EmailConfirmed = true,
                    CreatedAt = DateTime.UtcNow
                }
            };

            _mockAccountManagementService
                .Setup(s => s.GetAccountsByRoleAsync(RoleNames.Operator))
                .ReturnsAsync(operators);

            _mockAccountManagementService
                .Setup(s => s.GetAccountsByRoleAsync(RoleNames.EquipmentManager))
                .ReturnsAsync(eqManagers);

            // Act
            var result = await _warehouseService.GetWarehouseManagersAsync();

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Single(resultList); // Chỉ 1 manager vì đã được group theo Id
        }

        [Fact]
        public async Task GetWarehouseManagersAsync_WhenNoManagers_ShouldReturnEmptyList()
        {
            // Arrange
            _mockAccountManagementService
                .Setup(s => s.GetAccountsByRoleAsync(RoleNames.Operator))
                .ReturnsAsync(new List<AccountResponseDto>());

            _mockAccountManagementService
                .Setup(s => s.GetAccountsByRoleAsync(RoleNames.EquipmentManager))
                .ReturnsAsync(new List<AccountResponseDto>());

            // Act
            var result = await _warehouseService.GetWarehouseManagersAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
        }
    }
}