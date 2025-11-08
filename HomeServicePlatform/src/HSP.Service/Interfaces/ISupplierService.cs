using HSP.Core.Dtos.Shared;
using HSP.Core.Dtos.WarehouseDto;

namespace HSP.Service.Interfaces
{
    public interface ISupplierService
    {
        Task<PagedList<SupplierListDto>> GetSuppliersAsync(PaginationParams paginationParams);
    }
}
