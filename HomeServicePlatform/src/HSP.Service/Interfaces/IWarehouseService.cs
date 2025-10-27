using HSP.Core.Dtos.WarehouseDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Dtos.AccountDto;

namespace HSP.Service.Interfaces
{
    public interface IWarehouseService
    {
        Task<PagedList<WarehouseListDto>> GetWarehousesAsync(int page = 1, int pageSize = 10, string? searchTerm = null);
        Task<WarehouseDetailDto?> GetWarehouseByIdAsync(Guid id);
        Task<WarehouseDto> CreateWarehouseAsync(CreateWarehouseDto input, Guid createdBy);
        Task<WarehouseDto> UpdateWarehouseAsync(Guid id, UpdateWarehouseDto input, Guid modifiedBy);
        Task<bool> DeleteWarehouseAsync(Guid id);
        Task<List<WarehouseListDto>> GetAllWarehousesAsync();
        Task<bool> WarehouseExistsAsync(Guid id);
        Task<bool> IsWarehouseNameUniqueAsync(string name, Guid? excludeId = null);
        Task<IEnumerable<UserDto>> GetWarehouseManagersAsync();
    }
}
