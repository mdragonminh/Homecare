using HSP.Core.Constans;
using HSP.Core.Dtos.WarehouseDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace HSP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class WarehouseController : ControllerBase
    {
        private readonly IWarehouseService _warehouseService;

        public WarehouseController(IWarehouseService warehouseService)
        {
            _warehouseService = warehouseService;
        }

        [HttpGet]
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EquipmentManager}")]
        public async Task<IActionResult> GetWarehouses([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? searchTerm = null)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 10;

                var result = await _warehouseService.GetWarehousesAsync(page, pageSize, searchTerm);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving warehouses", details = ex.Message });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EquipmentManager}")]
        public async Task<IActionResult> GetWarehouse(Guid id)
        {
            try
            {
                var warehouse = await _warehouseService.GetWarehouseByIdAsync(id);
                if (warehouse == null)
                {
                    return NotFound(new { message = "Warehouse not found" });
                }

                return Ok(warehouse);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving warehouse", details = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EquipmentManager}")]
        public async Task<IActionResult> CreateWarehouse([FromBody] CreateWarehouseDto input)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var warehouse = await _warehouseService.CreateWarehouseAsync(input, userId);
                return CreatedAtAction(nameof(GetWarehouse), new { id = warehouse.Id }, warehouse);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating warehouse", details = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EquipmentManager}")]
        public async Task<IActionResult> UpdateWarehouse(Guid id, [FromBody] UpdateWarehouseDto input)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var warehouse = await _warehouseService.UpdateWarehouseAsync(id, input, userId);
                return Ok(warehouse);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating warehouse", details = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = RoleNames.Admin)]
        public async Task<IActionResult> DeleteWarehouse(Guid id)
        {
            try
            {
                var result = await _warehouseService.DeleteWarehouseAsync(id);
                if (!result)
                {
                    return NotFound(new { message = "Warehouse not found" });
                }

                return Ok(new { message = "Warehouse deleted successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting warehouse", details = ex.Message });
            }
        }

        [HttpGet("all")]
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EquipmentManager}")]
        public async Task<IActionResult> GetAllWarehouses()
        {
            try
            {
                var warehouses = await _warehouseService.GetAllWarehousesAsync();
                return Ok(warehouses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving warehouses", details = ex.Message });
            }
        }

        [HttpGet("{id}/exists")]
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EquipmentManager}")]
        public async Task<IActionResult> CheckWarehouseExists(Guid id)
        {
            try
            {
                var exists = await _warehouseService.WarehouseExistsAsync(id);
                return Ok(new { exists });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while checking warehouse", details = ex.Message });
            }
        }
    }
}
