using HSP.Core.Constans;
using HSP.Core.Dtos.AccountDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Dtos.WarehouseDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.DAL.Extensions;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HSP.Service.Implementations.Internal
{
    public class WarehouseService : IWarehouseService
    {
        private readonly IRepository<Warehouse, Guid> _warehouseRepository;
        private readonly IRepository<Equipment, Guid> _equipmentRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IAccountManagementService _accountManagementService;

        public WarehouseService(
            IRepository<Warehouse, Guid> warehouseRepository,
            IRepository<Equipment, Guid> equipmentRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork,
            IAccountManagementService accountManagementService
            )
        {
            _warehouseRepository = warehouseRepository;
            _equipmentRepository = equipmentRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _accountManagementService = accountManagementService;
        }

        public async Task<PagedList<WarehouseListDto>> GetWarehousesAsync(int page = 1, int pageSize = 10, string? searchTerm = null)
        {
            var query = _warehouseRepository.GetAll(w => w.Manager);

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                query = query.Where(w => w.Name.Contains(searchTerm) ||
                                        (w.Address != null && w.Address.Contains(searchTerm)));
            }

            var paginationParams = new PaginationParams
            {
                PageNumber = page,
                PageSize = pageSize,
                OrderBy = "DateCreated descending" 
            };

            var dtoQuery = query.Select(w => new WarehouseListDto
            {
                Id = w.Id,
                Name = w.Name,
                Address = w.Address,
                ManagerName = w.Manager != null ? w.Manager.FullName : null,
                TotalEquipments = w.Equipments.Count(e => !e.IsDeleted),
                DateCreated = w.DateCreated
            });

            return await dtoQuery.ToPagedListAsync(paginationParams);
        }

        public async Task<WarehouseDetailDto?> GetWarehouseByIdAsync(Guid id)
        {
            var warehouse = await _warehouseRepository.GetAll(w => w.Manager, w => w.Equipments)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (warehouse == null)
                return null;

            return new WarehouseDetailDto
            {
                Id = warehouse.Id,
                Name = warehouse.Name,
                Address = warehouse.Address,
                ManagerId = warehouse.ManagerId,
                ManagerName = warehouse.Manager?.FullName,
                ManagerEmail = warehouse.Manager?.Email,
                Equipments = warehouse.Equipments
                    .Where(e => !e.IsDeleted)
                    .Select(e => new EquipmentInWarehouseDto
                    {
                        Id = e.Id,
                        Name = e.Name,
                        EquipmentCode = e.EquipmentCode,
                        Quantity = e.Quantity,
                        Description = e.Description,
                        DateCreated = e.DateCreated,
                        DateModified = e.DateModified
                    }).ToList(),
                DateCreated = warehouse.DateCreated,
                DateModified = warehouse.DateModified,
                CreatedBy = warehouse.CreatedBy,
                ModifiedBy = warehouse.ModifiedBy
            };
        }

        public async Task<WarehouseDto> CreateWarehouseAsync(CreateWarehouseDto input, Guid createdBy)
        {
            // Check if name is unique
            if (!await IsWarehouseNameUniqueAsync(input.Name))
            {
                throw new ArgumentException("Warehouse name already exists");
            }

            // Validate manager if provided
            if (input.ManagerId.HasValue)
            {
                // Bạn có thể cân nhắc dùng _accountManagementService.GetAccountByIdAsync ở đây
                var managerUser = await _userRepository.FindByIdAsync(input.ManagerId.Value);
                if (managerUser == null)
                {
                    throw new ArgumentException("Manager not found");
                }
            }

            var warehouse = new Warehouse
            {
                Id = Guid.NewGuid(),
                Name = input.Name,
                Address = input.Address,
                ManagerId = input.ManagerId,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                CreatedBy = createdBy,
                ModifiedBy = createdBy,
                IsDeleted = false
            };

            await _warehouseRepository.AddAsync(warehouse);
            await _unitOfWork.SaveChangesAsync();

            // Return DTO
            var manager = input.ManagerId.HasValue ?
                await _userRepository.FindByIdAsync(input.ManagerId.Value) : null;

            return new WarehouseDto
            {
                Id = warehouse.Id,
                Name = warehouse.Name,
                Address = warehouse.Address,
                ManagerId = warehouse.ManagerId,
                ManagerName = manager?.FullName,
                TotalEquipments = 0,
                DateCreated = warehouse.DateCreated,
                DateModified = warehouse.DateModified
            };
        }

        public async Task<WarehouseDto> UpdateWarehouseAsync(Guid id, UpdateWarehouseDto input, Guid modifiedBy)
        {
            var warehouse = await _warehouseRepository.GetByIdAsync(id);
            if (warehouse == null)
            {
                throw new ArgumentException("Warehouse not found");
            }

            // Check if name is unique (excluding current warehouse)
            if (!await IsWarehouseNameUniqueAsync(input.Name, id))
            {
                throw new ArgumentException("Warehouse name already exists");
            }

            // Validate manager if provided
            if (input.ManagerId.HasValue)
            {
                var managerUser2 = await _userRepository.FindByIdAsync(input.ManagerId.Value);
                if (managerUser2 == null)
                {
                    throw new ArgumentException("Manager not found");
                }
            }

            warehouse.Name = input.Name;
            warehouse.Address = input.Address;
            warehouse.ManagerId = input.ManagerId;
            warehouse.DateModified = DateTime.UtcNow;
            warehouse.ModifiedBy = modifiedBy;

            _warehouseRepository.Update(warehouse);
            await _unitOfWork.SaveChangesAsync();

            // Get manager name for response
            var managerName = input.ManagerId.HasValue ?
                (await _userRepository.FindByIdAsync(input.ManagerId.Value))?.FullName : null;

            var equipmentCount = await _equipmentRepository.GetAll()
                .CountAsync(e => e.WarehouseId == id && !e.IsDeleted);

            return new WarehouseDto
            {
                Id = warehouse.Id,
                Name = warehouse.Name,
                Address = warehouse.Address,
                ManagerId = warehouse.ManagerId,
                ManagerName = managerName,
                TotalEquipments = equipmentCount,
                DateCreated = warehouse.DateCreated,
                DateModified = warehouse.DateModified
            };
        }

        public async Task<bool> DeleteWarehouseAsync(Guid id)
        {
            var warehouse = await _warehouseRepository.GetByIdAsync(id);
            if (warehouse == null)
                return false;

            // Check if warehouse has equipment
            var hasEquipment = await _equipmentRepository.GetAll()
                .AnyAsync(e => e.WarehouseId == id && !e.IsDeleted);

            if (hasEquipment)
            {
                throw new InvalidOperationException("Cannot delete warehouse that contains equipment");
            }

            _warehouseRepository.SoftDelete(warehouse);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<List<WarehouseListDto>> GetAllWarehousesAsync()
        {
            return await _warehouseRepository.GetAll(w => w.Manager)
                .Select(w => new WarehouseListDto
                {
                    Id = w.Id,
                    Name = w.Name,
                    Address = w.Address,
                    ManagerName = w.Manager != null ? w.Manager.FullName : null,
                    TotalEquipments = w.Equipments.Count(e => !e.IsDeleted),
                    DateCreated = w.DateCreated
                })
                .ToListAsync();
        }

        public async Task<bool> WarehouseExistsAsync(Guid id)
        {
            return await _warehouseRepository.AnyAsync(w => w.Id == id);
        }

        public async Task<bool> IsWarehouseNameUniqueAsync(string name, Guid? excludeId = null)
        {
            var query = _warehouseRepository.GetAll().Where(w => w.Name == name);

            if (excludeId.HasValue)
            {
                query = query.Where(w => w.Id != excludeId.Value);
            }

            return !await query.AnyAsync();
        }

        public async Task<IEnumerable<UserDto>> GetWarehouseManagersAsync()
        {
            var operators = await _accountManagementService.GetAccountsByRoleAsync(RoleNames.Operator);
            var eqManagers = await _accountManagementService.GetAccountsByRoleAsync(RoleNames.EquipmentManager);

            var allManagers = operators.Concat(eqManagers)
                                       .GroupBy(a => a.Id)
                                       .Select(g => g.First());

            return allManagers.Select(a => new UserDto
            {
                Id = Guid.Parse(a.Id),
                Email = a.Email,
                Username = a.Username,
                FullName = a.FullName,
                PhoneNumber = a.PhoneNumber,
                Role = a.Role,
                Department = a.Department,
                IsActive = a.IsActive,
                EmailConfirmed = a.EmailConfirmed,
                CreatedAt = a.CreatedAt,
                LastLoginAt = a.LastLoginAt,
                CreatedBy = a.CreatedBy
            });
        }
    }
}