using HSP.Core.Dtos.Shared;
using HSP.Core.Dtos.WarehouseDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.DAL.Extensions; 
using HSP.Service.Interfaces;
using Microsoft.Extensions.Localization;

namespace HSP.Service.Implementations
{
    public class SupplierService : BaseService, ISupplierService
    {
        private readonly IRepository<Supplier, Guid> _supplierRepository;

        public SupplierService(
            IUnitOfWork unitOfWork,
            IStringLocalizer<SharedResource> localizer,
            IRepository<Supplier, Guid> supplierRepository
        ) : base(unitOfWork, localizer)
        {
            _supplierRepository = supplierRepository;
        }
        
        public async Task<PagedList<SupplierListDto>> GetSuppliersAsync(PaginationParams paginationParams)
        {
            var query = _supplierRepository.GetAll().Where(s => !s.IsDeleted);

            if (string.IsNullOrWhiteSpace(paginationParams.OrderBy))
            {
                paginationParams.OrderBy = "Name"; 
            }

            var pagedSuppliers = await query.ToPagedListAsync(paginationParams);

            var suppliersDto = pagedSuppliers.Items.Select(s => new SupplierListDto
            {
                Id = s.Id,
                Name = s.Name
            }).ToList();

            return new PagedList<SupplierListDto>(
                suppliersDto,
                pagedSuppliers.TotalCount,
                pagedSuppliers.CurrentPage,
                pagedSuppliers.PageSize
            );
        }
    }
}