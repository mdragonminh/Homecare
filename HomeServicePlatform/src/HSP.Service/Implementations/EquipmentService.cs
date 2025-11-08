using HSP.Core.Dtos.Shared;
using HSP.Core.Dtos.WarehouseDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.DAL.Interfaces;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HSP.Service.Implementations
{
    public class EquipmentService : IEquipmentService
    {
        private readonly IRepository<Equipment, Guid> _equipmentRepository;
        private readonly IRepository<Warehouse, Guid> _warehouseRepository;
        private readonly IRepository<Supplier, Guid> _supplierRepository; 
        private readonly IUnitOfWork _unitOfWork;

        public EquipmentService(
            IRepository<Equipment, Guid> equipmentRepository,
            IRepository<Warehouse, Guid> warehouseRepository,
            IRepository<Supplier, Guid> supplierRepository,
            IUnitOfWork unitOfWork)
        {
            _equipmentRepository = equipmentRepository;
            _warehouseRepository = warehouseRepository;
            _supplierRepository = supplierRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<PagedList<EquipmentListDto>> GetEquipmentsAsync(int page = 1, int pageSize = 10, string? searchTerm = null, Guid? warehouseId = null)
        {
            var query = _equipmentRepository.GetAll(e => e.Warehouse, e => e.Supplier);

			if (!string.IsNullOrWhiteSpace(searchTerm))
			{
				query = query.Where(e => e.Name.Contains(searchTerm) ||
																(e.EquipmentCode != null && e.EquipmentCode.Contains(searchTerm)));
			}

			if (warehouseId.HasValue)
			{
				query = query.Where(e => e.WarehouseId == warehouseId.Value);
			}

			var paginationParams = new PaginationParams
			{
				PageNumber = page,
				PageSize = pageSize,
				OrderBy = "DateCreated descending"
			};

            var equipments = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new EquipmentListDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    EquipmentCode = e.EquipmentCode,
                    Quantity = e.Quantity,
                    WarehouseName = e.Warehouse.Name,
                    DateCreated = e.DateCreated,
                    Brand = e.Brand,
                    ModelNumber = e.ModelNumber,
                    UnitPrice = e.UnitPrice,
                    SupplierName = e.Supplier != null ? e.Supplier.Name : string.Empty,
                    IsActive = e.IsActive
                })
                .ToListAsync();

			return await dtoQuery.ToPagedListAsync(paginationParams);
		}

        public async Task<EquipmentDto?> GetEquipmentByIdAsync(Guid id)
        {
            var equipment = await _equipmentRepository.GetAll(e => e.Warehouse, e => e.Supplier)
                .FirstOrDefaultAsync(e => e.Id == id);

			if (equipment == null)
				return null;

            return new EquipmentDto
            {
                Id = equipment.Id,
                Name = equipment.Name,
                EquipmentCode = equipment.EquipmentCode,
                Quantity = equipment.Quantity,
                WarehouseId = equipment.WarehouseId,
                WarehouseName = equipment.Warehouse.Name,
                Description = equipment.Description,
                DateCreated = equipment.DateCreated,
                DateModified = equipment.DateModified,
                Brand = equipment.Brand,
                ModelNumber = equipment.ModelNumber,
                UnitOfMeasure = equipment.UnitOfMeasure,
                UnitPrice = equipment.UnitPrice,
                CostPrice = equipment.CostPrice,
                WarrantyDurationMonths = equipment.WarrantyDurationMonths,
                SupplierId = equipment.SupplierId,
                SupplierName = equipment.Supplier?.Name ?? string.Empty,
                IsActive = equipment.IsActive
            };
        }

        public async Task<EquipmentDto> CreateEquipmentAsync(CreateEquipmentDto input, Guid createdBy)
        {
            if (!await _warehouseRepository.AnyAsync(w => w.Id == input.WarehouseId))
            {
                throw new ArgumentException("Warehouse not found");
            }

            if (input.SupplierId.HasValue && !await _supplierRepository.AnyAsync(s => s.Id == input.SupplierId.Value))
            {
                throw new ArgumentException("Supplier not found");
            }

            if (!string.IsNullOrWhiteSpace(input.EquipmentCode))
            {
                if (!await IsEquipmentCodeUniqueAsync(input.EquipmentCode))
                {
                    throw new ArgumentException("Equipment code already exists");
                }
            }

            var equipment = new Equipment
            {
                Id = Guid.NewGuid(),
                Name = input.Name,
                EquipmentCode = input.EquipmentCode,
                Quantity = input.Quantity,
                WarehouseId = input.WarehouseId,
                Description = input.Description,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                CreatedBy = createdBy,
                ModifiedBy = createdBy,
                IsDeleted = false,
                Brand = input.Brand,
                ModelNumber = input.ModelNumber,
                UnitOfMeasure = input.UnitOfMeasure,
                UnitPrice = input.UnitPrice,
                CostPrice = input.CostPrice,
                WarrantyDurationMonths = input.WarrantyDurationMonths,
                SupplierId = input.SupplierId,
                IsActive = input.IsActive
            };

			await _equipmentRepository.AddAsync(equipment);
			await _unitOfWork.SaveChangesAsync();

            var warehouse = await _warehouseRepository.GetByIdAsync(input.WarehouseId);
            var supplier = input.SupplierId.HasValue ? await _supplierRepository.GetByIdAsync(input.SupplierId.Value) : null;

            return new EquipmentDto
            {
                Id = equipment.Id,
                Name = equipment.Name,
                EquipmentCode = equipment.EquipmentCode,
                Quantity = equipment.Quantity,
                WarehouseId = equipment.WarehouseId,
                WarehouseName = warehouse?.Name ?? "",
                Description = equipment.Description,
                DateCreated = equipment.DateCreated,
                DateModified = equipment.DateModified,
                Brand = equipment.Brand,
                ModelNumber = equipment.ModelNumber,
                UnitOfMeasure = equipment.UnitOfMeasure,
                UnitPrice = equipment.UnitPrice,
                CostPrice = equipment.CostPrice,
                WarrantyDurationMonths = equipment.WarrantyDurationMonths,
                SupplierId = equipment.SupplierId,
                SupplierName = supplier?.Name ?? string.Empty,
                IsActive = equipment.IsActive
            };
        }

		public async Task<EquipmentDto> UpdateEquipmentAsync(Guid id, UpdateEquipmentDto input, Guid modifiedBy)
		{
			var equipment = await _equipmentRepository.GetByIdAsync(id);
			if (equipment == null)
			{
				throw new ArgumentException("Equipment not found");
			}

            if (!await _warehouseRepository.AnyAsync(w => w.Id == input.WarehouseId))
            {
                throw new ArgumentException("Warehouse not found");
            }

            if (input.SupplierId.HasValue && !await _supplierRepository.AnyAsync(s => s.Id == input.SupplierId.Value))
            {
                throw new ArgumentException("Supplier not found");
            }

            if (!string.IsNullOrWhiteSpace(input.EquipmentCode))
            {
                if (!await IsEquipmentCodeUniqueAsync(input.EquipmentCode, id))
                {
                    throw new ArgumentException("Equipment code already exists");
                }
            }

            equipment.Name = input.Name;
            equipment.EquipmentCode = input.EquipmentCode;
            equipment.Quantity = input.Quantity;
            equipment.WarehouseId = input.WarehouseId;
            equipment.Description = input.Description;
            equipment.DateModified = DateTime.UtcNow;
            equipment.ModifiedBy = modifiedBy;
            equipment.Brand = input.Brand;
            equipment.ModelNumber = input.ModelNumber;
            equipment.UnitOfMeasure = input.UnitOfMeasure;
            equipment.UnitPrice = input.UnitPrice;
            equipment.CostPrice = input.CostPrice;
            equipment.WarrantyDurationMonths = input.WarrantyDurationMonths;
            equipment.SupplierId = input.SupplierId;
            equipment.IsActive = input.IsActive;

			_equipmentRepository.Update(equipment);
			await _unitOfWork.SaveChangesAsync();

            var warehouse = await _warehouseRepository.GetByIdAsync(input.WarehouseId);
            var supplier = input.SupplierId.HasValue ? await _supplierRepository.GetByIdAsync(input.SupplierId.Value) : null;

            return new EquipmentDto
            {
                Id = equipment.Id,
                Name = equipment.Name,
                EquipmentCode = equipment.EquipmentCode,
                Quantity = equipment.Quantity,
                WarehouseId = equipment.WarehouseId,
                WarehouseName = warehouse?.Name ?? "",
                Description = equipment.Description,
                DateCreated = equipment.DateCreated,
                DateModified = equipment.DateModified,
                Brand = equipment.Brand,
                ModelNumber = equipment.ModelNumber,
                UnitOfMeasure = equipment.UnitOfMeasure,
                UnitPrice = equipment.UnitPrice,
                CostPrice = equipment.CostPrice,
                WarrantyDurationMonths = equipment.WarrantyDurationMonths,
                SupplierId = equipment.SupplierId,
                SupplierName = supplier?.Name ?? string.Empty,
                IsActive = equipment.IsActive
            };
        }

		public async Task<bool> DeleteEquipmentAsync(Guid id)
		{
			var equipment = await _equipmentRepository.GetByIdAsync(id);
			if (equipment == null)
				return false;

			_equipmentRepository.SoftDelete(equipment);
			await _unitOfWork.SaveChangesAsync();
			return true;
		}

        public async Task<EquipmentDto> UpdateEquipmentQuantityAsync(Guid id, UpdateEquipmentQuantityDto input, Guid modifiedBy)
        {
            var equipment = await _equipmentRepository.GetAll(e => e.Warehouse, e => e.Supplier)
                .FirstOrDefaultAsync(e => e.Id == id);

			if (equipment == null)
			{
				throw new ArgumentException("Equipment not found");
			}

			equipment.Quantity = input.Quantity;
			equipment.DateModified = DateTime.UtcNow;
			equipment.ModifiedBy = modifiedBy;

			_equipmentRepository.Update(equipment);
			await _unitOfWork.SaveChangesAsync();

            return new EquipmentDto
            {
                Id = equipment.Id,
                Name = equipment.Name,
                EquipmentCode = equipment.EquipmentCode,
                Quantity = equipment.Quantity,
                WarehouseId = equipment.WarehouseId,
                WarehouseName = equipment.Warehouse.Name,
                Description = equipment.Description,
                DateCreated = equipment.DateCreated,
                DateModified = equipment.DateModified,
                Brand = equipment.Brand,
                ModelNumber = equipment.ModelNumber,
                UnitOfMeasure = equipment.UnitOfMeasure,
                UnitPrice = equipment.UnitPrice,
                CostPrice = equipment.CostPrice,
                WarrantyDurationMonths = equipment.WarrantyDurationMonths,
                SupplierId = equipment.SupplierId,
                SupplierName = equipment.Supplier?.Name ?? string.Empty,
                IsActive = equipment.IsActive
            };
        }

        public async Task<List<EquipmentListDto>> GetEquipmentsByWarehouseIdAsync(Guid warehouseId)
        {
            return await _equipmentRepository.GetAll(e => e.Warehouse, e => e.Supplier)
                .Where(e => e.WarehouseId == warehouseId)
                .Select(e => new EquipmentListDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    EquipmentCode = e.EquipmentCode,
                    Quantity = e.Quantity,
                    WarehouseName = e.Warehouse.Name,
                    DateCreated = e.DateCreated,
                    Brand = e.Brand,
                    ModelNumber = e.ModelNumber,
                    UnitPrice = e.UnitPrice,
                    SupplierName = e.Supplier != null ? e.Supplier.Name : string.Empty,
                    IsActive = e.IsActive
                })
                .ToListAsync();
        }

		public async Task<bool> EquipmentExistsAsync(Guid id)
		{
			return await _equipmentRepository.AnyAsync(e => e.Id == id);
		}

		public async Task<bool> IsEquipmentCodeUniqueAsync(string? code, Guid? excludeId = null)
		{
			if (string.IsNullOrWhiteSpace(code))
				return true;

			var query = _equipmentRepository.GetAll().Where(e => e.EquipmentCode == code);

			if (excludeId.HasValue)
			{
				query = query.Where(e => e.Id != excludeId.Value);
			}

            return !await query.AnyAsync();
        }
    }
}