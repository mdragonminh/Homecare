using HSP.Core.Constans;
using HSP.Core.Dtos.EquipmentRequest;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HSP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EquipmentRequestController : ControllerBase
    {
        private readonly IEquipmentRequestService _equipmentRequestService;

        public EquipmentRequestController(IEquipmentRequestService equipmentRequestService)
        {
            _equipmentRequestService = equipmentRequestService;
        }

        /// <summary>
        /// Get all equipment requests with pagination and filters
        /// </summary>
        [HttpGet]
        [Authorize(Roles = RoleNames.EquipmentManager)]
        public async Task<IActionResult> GetAllEquipmentRequests([FromQuery] EquipmentRequestFilterDto filter)
        {
            try
            {
                var (items, totalCount, totalPages) = await _equipmentRequestService.GetAllEquipmentRequestsAsync(filter);

                return Ok(new
                {
                    items,
                    pagination = new
                    {
                        pageNumber = filter.PageNumber,
                        pageSize = filter.PageSize,
                        totalCount,
                        totalPages
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get equipment request detail by ID
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = RoleNames.EquipmentManager + "," + RoleNames.Technician)]
        public async Task<IActionResult> GetEquipmentRequestDetail(Guid id)
        {
            try
            {
                var detail = await _equipmentRequestService.GetEquipmentRequestDetailAsync(id);

                if (detail == null)
                    return NotFound(new { message = "Equipment request not found" });

                return Ok(detail);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Approve equipment request (Equipment Manager confirms and deducts inventory)
        /// </summary>
        [HttpPost("approve")]
        [Authorize(Roles = RoleNames.EquipmentManager)]
        public async Task<IActionResult> ApproveEquipmentRequest([FromBody] ApproveEquipmentRequestDto input)
        {
            try
            {
                var managerId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                var result = await _equipmentRequestService.ApproveEquipmentRequestAsync(input, managerId);

                if (!result)
                    return BadRequest(new { message = "Failed to approve equipment request" });

                return Ok(new { message = "Equipment request approved successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Technician confirms receipt of equipment
        /// </summary>
        [HttpPost("confirm-receipt")]
        [Authorize(Roles = RoleNames.Technician)]
        public async Task<IActionResult> ConfirmReceipt([FromBody] ConfirmReceiptDto input)
        {
            try
            {
                var technicianUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
                var result = await _equipmentRequestService.ConfirmReceiptAsync(input, technicianUserId);

                if (!result)
                    return BadRequest(new { message = "Failed to confirm receipt" });

                return Ok(new { message = "Equipment receipt confirmed successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
