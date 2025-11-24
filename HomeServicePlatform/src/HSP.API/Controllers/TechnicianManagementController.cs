using HSP.API.Extensions;
using HSP.Core.Constans;
using HSP.Core.Dtos.Shared;
using HSP.Core.Dtos.TechnicianProfileDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HSP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TechnicianManagementController : ControllerBase
    {
        private readonly ITechnicianProfileService _technicianProfileService;

        public TechnicianManagementController(ITechnicianProfileService technicianProfileService)
        {
            _technicianProfileService = technicianProfileService;
        }
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Operator},{RoleNames.Supporter}")]
        [HttpGet("technicians")]
        public async Task<ActionResult<PagedList<TechnicianProfileResponseDto>>> GetTechnicians([FromQuery] TechnicianProfileFilterParams filterParams)
        {
            try
            {
                var result = await _technicianProfileService.GetTechniciansAsync(filterParams);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã có lỗi xảy ra khi lấy danh sách technician", error = ex.Message });
            }
        }
       
        [HttpGet("technicians/{id}")]
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Operator},{RoleNames.Supporter},{RoleNames.Technician}")]
        public async Task<ActionResult<TechnicianProfileResponseDto>> GetTechnicianById(string id)
        {
            try
            {
                var result = await _technicianProfileService.GetTechnicianByIdAsync(Guid.Parse(id));
                if (result == null)
                {
                    return NotFound(new { message = "Không tìm thấy technician" });
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã có lỗi xảy ra khi lấy thông tin technician", error = ex.Message });
            }
        }
        [HttpPut]
        [Authorize(Roles = RoleNames.Technician)]
        public async Task<IActionResult> UpdateTechnician(UpdateTechnicianProfileDto input)
        {
            try {
                var userId = User.GetUserId();
                var result = await _technicianProfileService.UpdateTechnicianProfileAsync(userId, input);
                return NoContent();
            } catch(Exception ex)
            {
                return StatusCode(500, new {message = "Đã có lỗi xảy ra", error = ex.Message });
            }
        }

        [HttpPost("technicians/{id}/approve")]
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Operator},{RoleNames.Supporter}")]
        public async Task<IActionResult> ApproveTechnician(Guid id)
        {
            try
            {
                var approvedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var result = await _technicianProfileService.ApproveTechnicianWithNotificationAsync(id, approvedBy);

                if (!result)
                {
                    return NotFound(new { message = "Không tìm thấy technician hoặc không thể duyệt" });
                }

                return Ok(new { message = "Đã duyệt thành công technician và gửi email thông báo" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã có lỗi xảy ra khi duyệt technician", error = ex.Message });
            }
        }

        [HttpPost("technicians/{id}/reject")]
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Operator},{RoleNames.Supporter}")]
        public async Task<IActionResult> RejectTechnician(Guid id, [FromBody] TechnicianRejectDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var rejectedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                // 💡 Truyền thêm lý do từ request vào service
                var result = await _technicianProfileService.RejectTechnicianWithNotificationAsync(id, rejectedBy, dto.RejectionReason);

                if (!result)
                {
                    return NotFound(new { message = "Không tìm thấy technician hoặc không thể từ chối" });
                }

                return Ok(new { message = "Đã từ chối thành công technician và gửi email thông báo" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã có lỗi xảy ra khi từ chối technician", error = ex.Message });
            }
        }

        [HttpPost("technicians/batch-approve")]
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Operator},{RoleNames.Supporter}")]
        public async Task<IActionResult> BatchApproveTechnicians([FromBody] List<Guid> technicianIds)
        {
            try
            {
                var approvedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var successCount = 0;

                foreach (var id in technicianIds)
                {
                    var result = await _technicianProfileService.ApproveTechnicianWithNotificationAsync(id, approvedBy);
                    if (result) successCount++;
                }

                return Ok(new
                {
                    message = $"Đã duyệt thành công {successCount}/{technicianIds.Count} technician và gửi email thông báo",
                    successCount = successCount,
                    totalCount = technicianIds.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã có lỗi xảy ra khi duyệt hàng loạt technician", error = ex.Message });
            }
        }

        [HttpPost("technicians/batch-reject")]
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Operator},{RoleNames.Supporter}")]
        public async Task<IActionResult> BatchRejectTechnicians([FromBody] List<Guid> technicianIds)
        {
            try
            {
                string reason = "Từ chối hàng loạt bởi quản trị viên";
                var rejectedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
                var successCount = 0;

                foreach (var id in technicianIds)
                {
                    var result = await _technicianProfileService.RejectTechnicianWithNotificationAsync(id, rejectedBy, reason);
                    if (result) successCount++;
                }

                return Ok(new
                {
                    message = $"Đã từ chối thành công {successCount}/{technicianIds.Count} technician và gửi email thông báo",
                    successCount = successCount,
                    totalCount = technicianIds.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã có lỗi xảy ra khi từ chối hàng loạt technician", error = ex.Message });
            }
        }
    }
}
