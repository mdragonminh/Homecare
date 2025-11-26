using HSP.Core.Dtos.AuditLogDto;
using HSP.Core.Dtos.Shared;

namespace HSP.Service.Interfaces
{
	public interface IAuditLogService
	{
		Task<PagedList<AuditLogDto>> GetAllAuditLogsAsync(AuditLogFilterDto filter);
		Task<AuditLogDto?> GetAuditLogByIdAsync(Guid id);
		Task<Guid> CreateAuditLogAsync(CreateAuditLogDto input);
		Task<bool> DeleteOldLogsAsync(int daysToKeep);
	}
}
