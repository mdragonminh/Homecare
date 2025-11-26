using HSP.API.Extensions;
using HSP.Core.Constans;
using HSP.Core.Dtos.AuditLogDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	[Authorize(Roles = RoleNames.Admin)]
	public class AuditLogController : ControllerBase
	{
		private readonly IAuditLogService _auditLogService;

		public AuditLogController(IAuditLogService auditLogService)
		{
			_auditLogService = auditLogService;
		}

		[HttpGet]
		public async Task<IActionResult> GetAllAuditLogs([FromQuery] AuditLogFilterDto filter)
		{
			try
			{
				var result = await _auditLogService.GetAllAuditLogsAsync(filter);
				return Ok(result);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { message = ex.Message });
			}
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> GetAuditLogById(Guid id)
		{
			try
			{
				var auditLog = await _auditLogService.GetAuditLogByIdAsync(id);
				if (auditLog == null)
					return NotFound(new { message = "Audit log not found" });

				return Ok(auditLog);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { message = ex.Message });
			}
		}

		[HttpDelete("cleanup")]
		public async Task<IActionResult> DeleteOldLogs([FromQuery] int daysToKeep = 90)
		{
			try
			{
				await _auditLogService.DeleteOldLogsAsync(daysToKeep);
				return Ok(new { message = $"Successfully deleted logs older than {daysToKeep} days" });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { message = ex.Message });
			}
		}
	}
}
