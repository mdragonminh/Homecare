using HSP.Core.Constans;
using HSP.Core.Dtos.Shared;
using HSP.Service.DTOs.Ticket;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HSP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TicketController : ControllerBase
    {
        private readonly ITicketService _ticketService;

        public TicketController(ITicketService ticketService)
        {
            _ticketService = ticketService;
        }

        private string? GetCurrentSupporterId()
        {
            return User?.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        [HttpGet]
        public async Task<IActionResult> GetMyTickets([FromQuery] PaginationParams paginationParams)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
            {
                return Unauthorized("Không tìm thấy thông tin người dùng.");
            }

            var userRole = User.FindFirstValue(ClaimTypes.Role);
            if (string.IsNullOrEmpty(userRole))
            {
                return Unauthorized("Không xác định được quyền hạn.");
            }

            var tickets = await _ticketService.GetTicketsAsync(userId, userRole, paginationParams);

            return Ok(tickets);
        }

        [HttpPost("assign-technician")]
        public async Task<IActionResult> AssignTechnician([FromBody] AssignTechnicianDto assignDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var supporterId = GetCurrentSupporterId();
            if (string.IsNullOrEmpty(supporterId))
            {
                return Unauthorized();
            }

            var result = await _ticketService.AssignTechnicianAsync(assignDto, supporterId);

            if (!result)
            {
                return BadRequest(new { message = "Không thể gán technician. (Ticket không tồn tại hoặc bạn không có quyền)." });
            }

            return Ok(new { message = "Gán technician thành công." });
        }

        [HttpPost("update-status")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateTicketStatusDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var supporterId = GetCurrentSupporterId();
            if (string.IsNullOrEmpty(supporterId))
            {
                return Unauthorized();
            }

            var result = await _ticketService.UpdateTicketStatusAsync(updateDto, supporterId);

            if (!result)
            {
                return BadRequest(new { message = "Không thể cập nhật trạng thái." });
            }

            return Ok(new { message = "Cập nhật trạng thái thành công." });
        }

        [HttpPost]
        [Authorize(Roles = RoleNames.Customer)] 
        public async Task<IActionResult> CreateTicket([FromBody] CreateTicketDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("Không tìm thấy thông tin người dùng.");
            }

            try
            {
                var resultDto = await _ticketService.CreateTicketAsync(createDto, userId);
                return Ok(resultDto);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex) 
            {
                return StatusCode(403, new { message = ex.Message });
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
    }
}