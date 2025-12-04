using HSP.Core.Dtos.WarehouseDto;
using HSP.Core.Dtos.Shared;

namespace HSP.Service.Interfaces
{
    public interface IEquipmentService
    {
        Task<PagedList<EquipmentListDto>> GetEquipmentsAsync(int page = 1, int pageSize = 10, string? searchTerm = null, Guid? warehouseId = null, bool isTech = false);
        Task<EquipmentDto?> GetEquipmentByIdAsync(Guid id);
        Task<EquipmentDto> CreateEquipmentAsync(CreateEquipmentDto input, Guid createdBy);
        Task<EquipmentDto> UpdateEquipmentAsync(Guid id, UpdateEquipmentDto input, Guid modifiedBy);
        Task<bool> DeleteEquipmentAsync(Guid id);
        Task<EquipmentDto> UpdateEquipmentQuantityAsync(Guid id, UpdateEquipmentQuantityDto input, Guid modifiedBy);
        Task<List<EquipmentListDto>> GetEquipmentsByWarehouseIdAsync(Guid warehouseId);
        Task<bool> EquipmentExistsAsync(Guid id);
        Task<bool> IsEquipmentCodeUniqueAsync(string? code, Guid? excludeId = null);
    }
}
