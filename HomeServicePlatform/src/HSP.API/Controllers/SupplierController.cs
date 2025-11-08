using HSP.Core.Constans;
using HSP.Core.Dtos.Shared;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HSP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SupplierController : ControllerBase
    {
        private readonly ISupplierService _supplierService;

        public SupplierController(ISupplierService supplierService)
        {
            _supplierService = supplierService;
        }

        [HttpGet]
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EquipmentManager}")]
        public async Task<IActionResult> GetSuppliers(
            [FromQuery] PaginationParams paginationParams)
        {
            try
            {
                var result = await _supplierService.GetSuppliersAsync(paginationParams);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving suppliers", details = ex.Message });
            }
        }
    }
}