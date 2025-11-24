using HSP.Core.Dtos.Shared;
using HSP.Core.Dtos.WarehouseDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Service.Implementations.Internal;
using Microsoft.EntityFrameworkCore;
using Moq;
using MockQueryable.Moq;
using Xunit;
using MockQueryable;

namespace HSP.Service.Test.Implementations.Internal
{
    public class EquipmentServiceTests
    {
        private readonly Mock<IRepository<Equipment, Guid>> _equipmentRepositoryMock;
        private readonly Mock<IRepository<Warehouse, Guid>> _warehouseRepositoryMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly EquipmentService _equipmentService;

        public EquipmentServiceTests()
        {
            _equipmentRepositoryMock = new Mock<IRepository<Equipment, Guid>>();
            _warehouseRepositoryMock = new Mock<IRepository<Warehouse, Guid>>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();

            _equipmentService = new EquipmentService(
                _equipmentRepositoryMock.Object,
                _warehouseRepositoryMock.Object,
                _unitOfWorkMock.Object
            );
        }

        #region GetEquipmentsAsync Tests

        [Fact]
        public async Task GetEquipmentsAsync_WithNoFilters_ReturnsPagedList()
        {
            // Arrange
            var equipments = GetSampleEquipments();
            var mockQueryable = equipments.BuildMock();

            _equipmentRepositoryMock
                .Setup(x => x.GetAll(It.IsAny<System.Linq.Expressions.Expression<Func<Equipment, object>>[]>()))
                .Returns(mockQueryable);

            // Act
            var result = await _equipmentService.GetEquipmentsAsync(1, 10);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(3, result.TotalCount);
        }

        [Fact]
        public async Task GetEquipmentsAsync_WithSearchTerm_ReturnsFilteredResults()
        {
            // Arrange
            var equipments = GetSampleEquipments();
            var mockQueryable = equipments.BuildMock();

            _equipmentRepositoryMock
                .Setup(x => x.GetAll(It.IsAny<System.Linq.Expressions.Expression<Func<Equipment, object>>[]>()))
                .Returns(mockQueryable);

            // Act
            var result = await _equipmentService.GetEquipmentsAsync(1, 10, "Laptop");

            // Assert
            Assert.NotNull(result);
            Assert.Single(result.Items);
            Assert.Contains("Laptop", result.Items.First().Name);
        }

        [Fact]
        public async Task GetEquipmentsAsync_WithWarehouseId_ReturnsFilteredResults()
        {
            // Arrange
            var warehouseId = Guid.NewGuid();
            var warehouse = new Warehouse { Id = warehouseId, Name = "Test Warehouse" };
            var equipments = GetSampleEquipments();
            equipments[0].WarehouseId = warehouseId;
            equipments[0].Warehouse = warehouse;
            var mockQueryable = equipments.BuildMock();

            _equipmentRepositoryMock
                .Setup(x => x.GetAll(It.IsAny<System.Linq.Expressions.Expression<Func<Equipment, object>>[]>()))
                .Returns(mockQueryable);

            // Act
            var result = await _equipmentService.GetEquipmentsAsync(1, 10, null, warehouseId);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result.Items);
            Assert.Equal("Laptop Dell", result.Items.First().Name);
            Assert.Equal("Test Warehouse", result.Items.First().WarehouseName);
        }

        #endregion

        #region GetEquipmentByIdAsync Tests

        [Fact]
        public async Task GetEquipmentByIdAsync_WithValidId_ReturnsEquipmentDto()
        {
            // Arrange
            var equipmentId = Guid.NewGuid();
            var equipment = GetSampleEquipment(equipmentId);
            var mockQueryable = new List<Equipment> { equipment }.BuildMock();

            _equipmentRepositoryMock
                .Setup(x => x.GetAll(It.IsAny<System.Linq.Expressions.Expression<Func<Equipment, object>>[]>()))
                .Returns(mockQueryable);

            // Act
            var result = await _equipmentService.GetEquipmentByIdAsync(equipmentId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(equipmentId, result.Id);
            Assert.Equal(equipment.Name, result.Name);
        }

        [Fact]
        public async Task GetEquipmentByIdAsync_WithInvalidId_ReturnsNull()
        {
            // Arrange
            var equipmentId = Guid.NewGuid();
            var mockQueryable = new List<Equipment>().BuildMock();

            _equipmentRepositoryMock
                .Setup(x => x.GetAll(It.IsAny<System.Linq.Expressions.Expression<Func<Equipment, object>>[]>()))
                .Returns(mockQueryable);

            // Act
            var result = await _equipmentService.GetEquipmentByIdAsync(equipmentId);

            // Assert
            Assert.Null(result);
        }

        #endregion

        #region CreateEquipmentAsync Tests

        [Fact]
        public async Task CreateEquipmentAsync_WithValidData_ReturnsCreatedEquipment()
        {
            // Arrange
            var warehouseId = Guid.NewGuid();
            var createdBy = Guid.NewGuid();
            var createDto = new CreateEquipmentDto
            {
                Name = "New Equipment",
                EquipmentCode = "EQ-001",
                Quantity = 10,
                WarehouseId = warehouseId,
                Brand = "Test Brand",
                UnitPrice = 1000,
                CostPrice = 800
            };

            var warehouse = new Warehouse { Id = warehouseId, Name = "Test Warehouse" };

            _warehouseRepositoryMock
                .Setup(x => x.AnyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Warehouse, bool>>>()))
                .ReturnsAsync(true);

            var mockQueryable = new List<Equipment>().BuildMock();
            _equipmentRepositoryMock
                .Setup(x => x.GetAll())
                .Returns(mockQueryable);

            _equipmentRepositoryMock
                .Setup(x => x.AddAsync(It.IsAny<Equipment>()))
                .ReturnsAsync((Equipment e) => e);

            _warehouseRepositoryMock
                .Setup(x => x.GetByIdAsync(warehouseId))
                .ReturnsAsync(warehouse);

            _unitOfWorkMock
                .Setup(x => x.SaveChangesAsync())
                .ReturnsAsync(1);

            // Act
            var result = await _equipmentService.CreateEquipmentAsync(createDto, createdBy);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(createDto.Name, result.Name);
            Assert.Equal(createDto.EquipmentCode, result.EquipmentCode);
            Assert.Equal(warehouse.Name, result.WarehouseName);
            _equipmentRepositoryMock.Verify(x => x.AddAsync(It.IsAny<Equipment>()), Times.Once);
            _unitOfWorkMock.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task CreateEquipmentAsync_WithInvalidWarehouse_ThrowsArgumentException()
        {
            // Arrange
            var createDto = new CreateEquipmentDto
            {
                Name = "New Equipment",
                WarehouseId = Guid.NewGuid()
            };

            _warehouseRepositoryMock
                .Setup(x => x.AnyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Warehouse, bool>>>()))
                .ReturnsAsync(false);

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _equipmentService.CreateEquipmentAsync(createDto, Guid.NewGuid())
            );
        }

        [Fact]
        public async Task CreateEquipmentAsync_WithDuplicateEquipmentCode_ThrowsArgumentException()
        {
            // Arrange
            var existingEquipment = GetSampleEquipment(Guid.NewGuid());
            var createDto = new CreateEquipmentDto
            {
                Name = "New Equipment",
                EquipmentCode = existingEquipment.EquipmentCode,
                WarehouseId = Guid.NewGuid()
            };

            _warehouseRepositoryMock
                .Setup(x => x.AnyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Warehouse, bool>>>()))
                .ReturnsAsync(true);

            var equipmentList = new List<Equipment> { existingEquipment };
            var mockQueryable = equipmentList.BuildMock();

            _equipmentRepositoryMock
                .Setup(x => x.GetAll())
                .Returns(mockQueryable);

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _equipmentService.CreateEquipmentAsync(createDto, Guid.NewGuid())
            );
        }

        #endregion

        #region UpdateEquipmentAsync Tests

        [Fact]
        public async Task UpdateEquipmentAsync_WithValidData_ReturnsUpdatedEquipment()
        {
            // Arrange
            var equipmentId = Guid.NewGuid();
            var warehouseId = Guid.NewGuid();
            var modifiedBy = Guid.NewGuid();
            var existingEquipment = GetSampleEquipment(equipmentId);
            existingEquipment.WarehouseId = warehouseId;

            var updateDto = new UpdateEquipmentDto
            {
                Name = "Updated Equipment",
                EquipmentCode = "EQ-002",
                Quantity = 20,
                WarehouseId = warehouseId,
                Brand = "Updated Brand",
                UnitPrice = 2000,
                CostPrice = 1500
            };

            var warehouse = new Warehouse { Id = warehouseId, Name = "Updated Warehouse" };

            _equipmentRepositoryMock
                .Setup(x => x.GetByIdAsync(equipmentId))
                .ReturnsAsync(existingEquipment);

            _warehouseRepositoryMock
                .Setup(x => x.AnyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Warehouse, bool>>>()))
                .ReturnsAsync(true);

            var mockQueryable = new List<Equipment>().BuildMock();
            _equipmentRepositoryMock
                .Setup(x => x.GetAll())
                .Returns(mockQueryable);

            _warehouseRepositoryMock
                .Setup(x => x.GetByIdAsync(warehouseId))
                .ReturnsAsync(warehouse);

            _unitOfWorkMock
                .Setup(x => x.SaveChangesAsync())
                .ReturnsAsync(1);

            // Act
            var result = await _equipmentService.UpdateEquipmentAsync(equipmentId, updateDto, modifiedBy);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(updateDto.Name, result.Name);
            Assert.Equal(updateDto.EquipmentCode, result.EquipmentCode);
            Assert.Equal(updateDto.Quantity, result.Quantity);
            _equipmentRepositoryMock.Verify(x => x.Update(It.IsAny<Equipment>()), Times.Once);
            _unitOfWorkMock.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task UpdateEquipmentAsync_WithInvalidId_ThrowsArgumentException()
        {
            // Arrange
            var equipmentId = Guid.NewGuid();
            var updateDto = new UpdateEquipmentDto { Name = "Test", WarehouseId = Guid.NewGuid() };

            _equipmentRepositoryMock
                .Setup(x => x.GetByIdAsync(equipmentId))
                .ReturnsAsync((Equipment?)null);

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _equipmentService.UpdateEquipmentAsync(equipmentId, updateDto, Guid.NewGuid())
            );
        }

        [Fact]
        public async Task UpdateEquipmentAsync_WithInvalidWarehouse_ThrowsArgumentException()
        {
            // Arrange
            var equipmentId = Guid.NewGuid();
            var existingEquipment = GetSampleEquipment(equipmentId);
            var updateDto = new UpdateEquipmentDto
            {
                Name = "Test",
                WarehouseId = Guid.NewGuid()
            };

            _equipmentRepositoryMock
                .Setup(x => x.GetByIdAsync(equipmentId))
                .ReturnsAsync(existingEquipment);

            _warehouseRepositoryMock
                .Setup(x => x.AnyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Warehouse, bool>>>()))
                .ReturnsAsync(false);

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _equipmentService.UpdateEquipmentAsync(equipmentId, updateDto, Guid.NewGuid())
            );
        }

        #endregion

        #region DeleteEquipmentAsync Tests

        [Fact]
        public async Task DeleteEquipmentAsync_WithValidId_ReturnsTrue()
        {
            // Arrange
            var equipmentId = Guid.NewGuid();
            var equipment = GetSampleEquipment(equipmentId);

            _equipmentRepositoryMock
                .Setup(x => x.GetByIdAsync(equipmentId))
                .ReturnsAsync(equipment);

            _unitOfWorkMock
                .Setup(x => x.SaveChangesAsync())
                .ReturnsAsync(1);

            // Act
            var result = await _equipmentService.DeleteEquipmentAsync(equipmentId);

            // Assert
            Assert.True(result);
            _equipmentRepositoryMock.Verify(x => x.SoftDelete(It.IsAny<Equipment>()), Times.Once);
            _unitOfWorkMock.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task DeleteEquipmentAsync_WithInvalidId_ReturnsFalse()
        {
            // Arrange
            var equipmentId = Guid.NewGuid();

            _equipmentRepositoryMock
                .Setup(x => x.GetByIdAsync(equipmentId))
                .ReturnsAsync((Equipment?)null);

            // Act
            var result = await _equipmentService.DeleteEquipmentAsync(equipmentId);

            // Assert
            Assert.False(result);
            _equipmentRepositoryMock.Verify(x => x.SoftDelete(It.IsAny<Equipment>()), Times.Never);
            _unitOfWorkMock.Verify(x => x.SaveChangesAsync(), Times.Never);
        }

        #endregion

        #region UpdateEquipmentQuantityAsync Tests

        [Fact]
        public async Task UpdateEquipmentQuantityAsync_WithValidData_ReturnsUpdatedEquipment()
        {
            // Arrange
            var equipmentId = Guid.NewGuid();
            var modifiedBy = Guid.NewGuid();
            var equipment = GetSampleEquipment(equipmentId);
            var mockQueryable = new List<Equipment> { equipment }.BuildMock();

            var updateDto = new UpdateEquipmentQuantityDto { Quantity = 50 };

            _equipmentRepositoryMock
                .Setup(x => x.GetAll(It.IsAny<System.Linq.Expressions.Expression<Func<Equipment, object>>[]>()))
                .Returns(mockQueryable);

            _unitOfWorkMock
                .Setup(x => x.SaveChangesAsync())
                .ReturnsAsync(1);

            // Act
            var result = await _equipmentService.UpdateEquipmentQuantityAsync(equipmentId, updateDto, modifiedBy);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(updateDto.Quantity, result.Quantity);
            _equipmentRepositoryMock.Verify(x => x.Update(It.IsAny<Equipment>()), Times.Once);
            _unitOfWorkMock.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task UpdateEquipmentQuantityAsync_WithInvalidId_ThrowsArgumentException()
        {
            // Arrange
            var equipmentId = Guid.NewGuid();
            var updateDto = new UpdateEquipmentQuantityDto { Quantity = 50 };
            var mockQueryable = new List<Equipment>().BuildMock();

            _equipmentRepositoryMock
                .Setup(x => x.GetAll(It.IsAny<System.Linq.Expressions.Expression<Func<Equipment, object>>[]>()))
                .Returns(mockQueryable);

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _equipmentService.UpdateEquipmentQuantityAsync(equipmentId, updateDto, Guid.NewGuid())
            );
        }

        #endregion

        #region GetEquipmentsByWarehouseIdAsync Tests

        [Fact]
        public async Task GetEquipmentsByWarehouseIdAsync_ReturnsEquipmentList()
        {
            // Arrange
            var warehouseId = Guid.NewGuid();
            var warehouse = new Warehouse { Id = warehouseId, Name = "Shared Warehouse" };
            var equipments = GetSampleEquipments();
            equipments[0].WarehouseId = warehouseId;
            equipments[0].Warehouse = warehouse;
            equipments[1].WarehouseId = warehouseId;
            equipments[1].Warehouse = warehouse;
            var mockQueryable = equipments.BuildMock();

            _equipmentRepositoryMock
                .Setup(x => x.GetAll(It.IsAny<System.Linq.Expressions.Expression<Func<Equipment, object>>[]>()))
                .Returns(mockQueryable);

            // Act
            var result = await _equipmentService.GetEquipmentsByWarehouseIdAsync(warehouseId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count);
            Assert.All(result, e => Assert.Equal("Shared Warehouse", e.WarehouseName));
        }

        #endregion

        #region EquipmentExistsAsync Tests

        [Fact]
        public async Task EquipmentExistsAsync_WithExistingId_ReturnsTrue()
        {
            // Arrange
            var equipmentId = Guid.NewGuid();

            _equipmentRepositoryMock
                .Setup(x => x.AnyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Equipment, bool>>>()))
                .ReturnsAsync(true);

            // Act
            var result = await _equipmentService.EquipmentExistsAsync(equipmentId);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task EquipmentExistsAsync_WithNonExistingId_ReturnsFalse()
        {
            // Arrange
            var equipmentId = Guid.NewGuid();

            _equipmentRepositoryMock
                .Setup(x => x.AnyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Equipment, bool>>>()))
                .ReturnsAsync(false);

            // Act
            var result = await _equipmentService.EquipmentExistsAsync(equipmentId);

            // Assert
            Assert.False(result);
        }

        #endregion

        #region IsEquipmentCodeUniqueAsync Tests

        [Fact]
        public async Task IsEquipmentCodeUniqueAsync_WithUniqueCode_ReturnsTrue()
        {
            // Arrange
            var code = "EQ-NEW";
            var mockQueryable = new List<Equipment>().BuildMock();

            _equipmentRepositoryMock
                .Setup(x => x.GetAll())
                .Returns(mockQueryable);

            // Act
            var result = await _equipmentService.IsEquipmentCodeUniqueAsync(code);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task IsEquipmentCodeUniqueAsync_WithExistingCode_ReturnsFalse()
        {
            // Arrange
            var code = "EQ-001";
            var equipment = GetSampleEquipment(Guid.NewGuid());
            equipment.EquipmentCode = code;
            var mockQueryable = new List<Equipment> { equipment }.BuildMock();

            _equipmentRepositoryMock
                .Setup(x => x.GetAll())
                .Returns(mockQueryable);

            // Act
            var result = await _equipmentService.IsEquipmentCodeUniqueAsync(code);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task IsEquipmentCodeUniqueAsync_WithNullCode_ReturnsTrue()
        {
            // Act
            var result = await _equipmentService.IsEquipmentCodeUniqueAsync(null);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task IsEquipmentCodeUniqueAsync_WithExcludeId_IgnoresExcludedEquipment()
        {
            // Arrange
            var equipmentId = Guid.NewGuid();
            var code = "EQ-001";
            var equipment = GetSampleEquipment(equipmentId);
            equipment.EquipmentCode = code;
            var mockQueryable = new List<Equipment> { equipment }.BuildMock();

            _equipmentRepositoryMock
                .Setup(x => x.GetAll())
                .Returns(mockQueryable);

            // Act
            var result = await _equipmentService.IsEquipmentCodeUniqueAsync(code, equipmentId);

            // Assert
            Assert.True(result);
        }

        #endregion

        #region Helper Methods

        private Equipment GetSampleEquipment(Guid id)
        {
            return new Equipment
            {
                Id = id,
                Name = "Test Equipment",
                EquipmentCode = "EQ-001",
                Quantity = 10,
                WarehouseId = Guid.NewGuid(),
                Warehouse = new Warehouse { Id = Guid.NewGuid(), Name = "Test Warehouse" },
                Brand = "Test Brand",
                ModelNumber = "Model-001",
                UnitOfMeasure = "Cái",
                UnitPrice = 1000,
                CostPrice = 800,
                WarrantyDurationMonths = 12,
                IsActive = true,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                IsDeleted = false
            };
        }

        private List<Equipment> GetSampleEquipments()
        {
            var warehouse = new Warehouse { Id = Guid.NewGuid(), Name = "Test Warehouse" };

            return new List<Equipment>
            {
                new Equipment
                {
                    Id = Guid.NewGuid(),
                    Name = "Laptop Dell",
                    EquipmentCode = "EQ-001",
                    Quantity = 10,
                    WarehouseId = warehouse.Id,
                    Warehouse = warehouse,
                    Brand = "Dell",
                    UnitPrice = 1000,
                    IsActive = true,
                    DateCreated = DateTime.UtcNow
                },
                new Equipment
                {
                    Id = Guid.NewGuid(),
                    Name = "Monitor LG",
                    EquipmentCode = "EQ-002",
                    Quantity = 20,
                    WarehouseId = Guid.NewGuid(),
                    Warehouse = new Warehouse { Id = Guid.NewGuid(), Name = "Warehouse 2" },
                    Brand = "LG",
                    UnitPrice = 500,
                    IsActive = true,
                    DateCreated = DateTime.UtcNow
                },
                new Equipment
                {
                    Id = Guid.NewGuid(),
                    Name = "Keyboard Logitech",
                    EquipmentCode = "EQ-003",
                    Quantity = 30,
                    WarehouseId = Guid.NewGuid(),
                    Warehouse = new Warehouse { Id = Guid.NewGuid(), Name = "Warehouse 3" },
                    Brand = "Logitech",
                    UnitPrice = 100,
                    IsActive = true,
                    DateCreated = DateTime.UtcNow
                }
            };
        }

        #endregion
    }
}