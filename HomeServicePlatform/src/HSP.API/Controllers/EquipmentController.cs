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
    public class EquipmentController : ControllerBase
    {
        private readonly IEquipmentService _equipmentService;

        public EquipmentController(IEquipmentService equipmentService)
        {
            _equipmentService = equipmentService;
        }

        [HttpGet]
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EquipmentManager},{RoleNames.Supporter}")]
        public async Task<IActionResult> GetEquipments(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchTerm = null,
            [FromQuery] Guid? warehouseId = null)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 10;

                var result = await _equipmentService.GetEquipmentsAsync(page, pageSize, searchTerm, warehouseId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving equipments", details = ex.Message });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EquipmentManager},{RoleNames.Supporter}")]
        public async Task<IActionResult> GetEquipment(Guid id)
        {
            try
            {
                var equipment = await _equipmentService.GetEquipmentByIdAsync(id);
                if (equipment == null)
                {
                    return NotFound(new { message = "Equipment not found" });
                }

                return Ok(equipment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving equipment", details = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EquipmentManager}")]
        public async Task<IActionResult> CreateEquipment([FromBody] CreateEquipmentDto input)
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

                var equipment = await _equipmentService.CreateEquipmentAsync(input, userId);
                return CreatedAtAction(nameof(GetEquipment), new { id = equipment.Id }, equipment);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating equipment", details = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EquipmentManager}")]
        public async Task<IActionResult> UpdateEquipment(Guid id, [FromBody] UpdateEquipmentDto input)
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

                var equipment = await _equipmentService.UpdateEquipmentAsync(id, input, userId);
                return Ok(equipment);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating equipment", details = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = RoleNames.Admin)]
        public async Task<IActionResult> DeleteEquipment(Guid id)
        {
            try
            {
                var result = await _equipmentService.DeleteEquipmentAsync(id);
                if (!result)
                {
                    return NotFound(new { message = "Equipment not found" });
                }

                return Ok(new { message = "Equipment deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting equipment", details = ex.Message });
            }
        }

        [HttpPatch("{id}/quantity")]
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EquipmentManager}")]
        public async Task<IActionResult> UpdateEquipmentQuantity(Guid id, [FromBody] UpdateEquipmentQuantityDto input)
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

                var equipment = await _equipmentService.UpdateEquipmentQuantityAsync(id, input, userId);
                return Ok(equipment);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating equipment quantity", details = ex.Message });
            }
        }

        [HttpGet("warehouse/{warehouseId}")]
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EquipmentManager}")]
        public async Task<IActionResult> GetEquipmentsByWarehouse(Guid warehouseId)
        {
            try
            {
                var equipments = await _equipmentService.GetEquipmentsByWarehouseIdAsync(warehouseId);
                return Ok(equipments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving equipments", details = ex.Message });
            }
        }

        [HttpGet("{id}/exists")]
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EquipmentManager}")]
        public async Task<IActionResult> CheckEquipmentExists(Guid id)
        {
            try
            {
                var exists = await _equipmentService.EquipmentExistsAsync(id);
                return Ok(new { exists });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while checking equipment", details = ex.Message });
            }
        }
    }
}
