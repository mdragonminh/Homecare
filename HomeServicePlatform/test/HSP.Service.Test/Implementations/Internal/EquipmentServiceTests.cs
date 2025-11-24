using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Xunit;
using Moq;
using MockQueryable.Moq;
using HSP.Service.Implementations.Internal;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.DAL.Interfaces;
using HSP.Core.Dtos.WarehouseDto;
using MockQueryable;

namespace HSP.Service.Test.Implementations.Internal
{
    public class EquipmentServiceTests
    {
        private readonly Mock<IRepository<Equipment, Guid>> _equipmentRepo;
        private readonly Mock<IRepository<Warehouse, Guid>> _warehouseRepo;
        private readonly Mock<IUnitOfWork> _uow;
        private readonly EquipmentService _service;

        public EquipmentServiceTests()
        {
            _equipmentRepo = new Mock<IRepository<Equipment, Guid>>();
            _warehouseRepo = new Mock<IRepository<Warehouse, Guid>>();
            _uow = new Mock<IUnitOfWork>();

        }

        // --------------------------
        // GetEquipmentByIdAsync
        // --------------------------
        [Fact]
        public async Task GetEquipmentByIdAsync_ShouldReturnNull_WhenNotFound()
        {
            var emptyData = new List<Equipment>().BuildMock();

            _equipmentRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Equipment, object>>[]>()))
                .Returns(emptyData);

            var result = await _service.GetEquipmentByIdAsync(Guid.NewGuid());

            Assert.Null(result);
        }

        [Fact]
        public async Task GetEquipmentByIdAsync_ShouldReturnDto_WhenFound()
        {
            var id = Guid.NewGuid();
            var data = new List<Equipment>
            {
                new Equipment
                {
                    Id = id,
                    Name = "Laptop",
                    Warehouse = new Warehouse { Name = "Main WH" },
                }
            }.BuildMock();

            _equipmentRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Equipment, object>>[]>()))
                .Returns(data);

            var result = await _service.GetEquipmentByIdAsync(id);

            Assert.NotNull(result);
            Assert.Equal("Laptop", result!.Name);
        }

        // --------------------------
        // CreateEquipmentAsync
        // --------------------------
        [Fact]
        public async Task CreateEquipmentAsync_ShouldThrow_WhenWarehouseNotFound()
        {
            _warehouseRepo.Setup(r => r.AnyAsync(It.IsAny<Expression<Func<Warehouse, bool>>>()))
                .ReturnsAsync(false);

            var dto = new CreateEquipmentDto { WarehouseId = Guid.NewGuid(), Name = "Test" };

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _service.CreateEquipmentAsync(dto, Guid.NewGuid()));
        }

        [Fact]
        public async Task CreateEquipmentAsync_ShouldThrow_WhenSupplierNotFound()
        {
            _warehouseRepo.Setup(r => r.AnyAsync(It.IsAny<Expression<Func<Warehouse, bool>>>()))
                .ReturnsAsync(true);

            var dto = new CreateEquipmentDto
            {
                WarehouseId = Guid.NewGuid(),
            };

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _service.CreateEquipmentAsync(dto, Guid.NewGuid()));
        }

        [Fact]
        public async Task CreateEquipmentAsync_ShouldThrow_WhenEquipmentCodeExists()
        {
            _warehouseRepo.Setup(r => r.AnyAsync(It.IsAny<Expression<Func<Warehouse, bool>>>()))
                .ReturnsAsync(true);

            var equipments = new List<Equipment>
            {
                new Equipment { EquipmentCode = "ABC" }
            }.BuildMock();

            _equipmentRepo.Setup(r => r.GetAll()).Returns(equipments);

            var dto = new CreateEquipmentDto
            {
                WarehouseId = Guid.NewGuid(),
                EquipmentCode = "ABC"
            };

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _service.CreateEquipmentAsync(dto, Guid.NewGuid()));
        }

        [Fact]
        public async Task CreateEquipmentAsync_ShouldCreateSuccessfully()
        {
            _warehouseRepo.Setup(r => r.AnyAsync(It.IsAny<Expression<Func<Warehouse, bool>>>()))
                .ReturnsAsync(true);

            var equipments = new List<Equipment>().BuildMock();
            _equipmentRepo.Setup(r => r.GetAll()).Returns(equipments);

            _warehouseRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(new Warehouse { Name = "WH" });

            Equipment? savedEntity = null;
            _equipmentRepo.Setup(r => r.AddAsync(It.IsAny<Equipment>()))
                .Callback<Equipment>(e => savedEntity = e)
                .ReturnsAsync((Equipment e) => e);

            var dto = new CreateEquipmentDto
            {
                WarehouseId = Guid.NewGuid(),
                Name = "New Item"
            };

            var result = await _service.CreateEquipmentAsync(dto, Guid.NewGuid());

            Assert.NotNull(savedEntity);
            Assert.Equal("New Item", result.Name);
            _uow.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        // --------------------------
        // UpdateEquipmentAsync
        // --------------------------
        [Fact]
        public async Task UpdateEquipmentAsync_ShouldThrow_WhenNotFound()
        {
            _equipmentRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((Equipment?)null);

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _service.UpdateEquipmentAsync(Guid.NewGuid(), new UpdateEquipmentDto(), Guid.NewGuid()));
        }

        [Fact]
        public async Task UpdateEquipmentAsync_ShouldUpdateSuccessfully()
        {
            var eq = new Equipment { Id = Guid.NewGuid(), Name = "Old" };

            _equipmentRepo.Setup(r => r.GetByIdAsync(eq.Id)).ReturnsAsync(eq);
            _warehouseRepo.Setup(r => r.AnyAsync(It.IsAny<Expression<Func<Warehouse, bool>>>()))
                .ReturnsAsync(true);

            var dto = new UpdateEquipmentDto { Name = "Updated" };
            var result = await _service.UpdateEquipmentAsync(eq.Id, dto, Guid.NewGuid());

            Assert.Equal("Updated", eq.Name);
            _uow.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        // --------------------------
        // DeleteEquipmentAsync
        // --------------------------
        [Fact]
        public async Task DeleteEquipmentAsync_ShouldReturnFalse_WhenNotFound()
        {
            _equipmentRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((Equipment?)null);

            var result = await _service.DeleteEquipmentAsync(Guid.NewGuid());
            Assert.False(result);
        }

        [Fact]
        public async Task DeleteEquipmentAsync_ShouldSoftDeleteSuccessfully()
        {
            var eq = new Equipment { Id = Guid.NewGuid() };

            _equipmentRepo.Setup(r => r.GetByIdAsync(eq.Id)).ReturnsAsync(eq);

            var result = await _service.DeleteEquipmentAsync(eq.Id);

            Assert.True(result);
            _equipmentRepo.Verify(r => r.SoftDelete(eq), Times.Once);
            _uow.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        // --------------------------
        // UpdateEquipmentQuantityAsync
        // --------------------------
        [Fact]
        public async Task UpdateEquipmentQuantityAsync_ShouldThrow_WhenNotFound()
        {
            var emptyData = new List<Equipment>().BuildMock();
            _equipmentRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Equipment, object>>[]>()))
                .Returns(emptyData);

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _service.UpdateEquipmentQuantityAsync(Guid.NewGuid(), new UpdateEquipmentQuantityDto(), Guid.NewGuid()));
        }

        // --------------------------
        // EquipmentExistsAsync
        // --------------------------
        [Fact]
        public async Task EquipmentExistsAsync_ShouldReturnTrue_WhenExists()
        {
            _equipmentRepo.Setup(r => r.AnyAsync(It.IsAny<Expression<Func<Equipment, bool>>>()))
                .ReturnsAsync(true);

            var result = await _service.EquipmentExistsAsync(Guid.NewGuid());
            Assert.True(result);
        }

        // --------------------------
        // IsEquipmentCodeUniqueAsync
        // --------------------------
        [Fact]
        public async Task IsEquipmentCodeUniqueAsync_ShouldReturnFalse_WhenDuplicate()
        {
            var equipments = new List<Equipment>
            {
                new Equipment { Id = Guid.NewGuid(), EquipmentCode = "A001" }
            }.BuildMock();

            _equipmentRepo.Setup(r => r.GetAll()).Returns(equipments);

            var result = await _service.IsEquipmentCodeUniqueAsync("A001");
            Assert.False(result);
        }
    }
}
