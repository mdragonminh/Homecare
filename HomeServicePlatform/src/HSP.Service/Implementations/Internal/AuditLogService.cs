using HSP.Core.Dtos.AuditLogDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.DAL.Extensions;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace HSP.Service.Implementations.Internal
{
	public class AuditLogService : BaseService, IAuditLogService
	{
		private readonly IRepository<AuditLog, Guid> _auditLogRepository;

		public AuditLogService(
			IRepository<AuditLog, Guid> auditLogRepository,
			IUnitOfWork unitOfWork,
			IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
		{
			_auditLogRepository = auditLogRepository;
		}

		public async Task<PagedList<AuditLogDto>> GetAllAuditLogsAsync(AuditLogFilterDto filter)
		{
			var query = _auditLogRepository.GetAll();

			// Apply filters
			if (!string.IsNullOrEmpty(filter.UserRole))
			{
				query = query.Where(a => a.UserRole == filter.UserRole);
			}

			if (filter.UserId.HasValue)
			{
				query = query.Where(a => a.UserId == filter.UserId.Value);
			}

			if (filter.Action.HasValue)
			{
				query = query.Where(a => a.Action == filter.Action.Value);
			}

			if (!string.IsNullOrEmpty(filter.EntityName))
			{
				query = query.Where(a => a.EntityName == filter.EntityName);
			}

			if (filter.FromDate.HasValue)
			{
				query = query.Where(a => a.DateCreated >= filter.FromDate.Value);
			}

			if (filter.ToDate.HasValue)
			{
				query = query.Where(a => a.DateCreated <= filter.ToDate.Value);
			}

			if (!string.IsNullOrEmpty(filter.SearchTerm))
			{
				query = query.Where(a =>
					a.UserName.Contains(filter.SearchTerm) ||
					a.EntityName.Contains(filter.SearchTerm) ||
					(a.Description != null && a.Description.Contains(filter.SearchTerm)));
			}

			// Order by date descending (newest first)
			query = query.OrderByDescending(a => a.DateCreated);

			var dtoQuery = query.Select(a => new AuditLogDto
			{
				Id = a.Id,
				UserId = a.UserId,
				UserName = a.UserName,
				UserRole = a.UserRole,
				Action = a.Action,
				EntityName = a.EntityName,
				EntityId = a.EntityId,
				OldValue = a.OldValue,
				NewValue = a.NewValue,
				Description = a.Description,
				DateCreated = a.DateCreated
			});

			return await dtoQuery.ToPagedListAsync(filter);
		}

		public async Task<AuditLogDto?> GetAuditLogByIdAsync(Guid id)
		{
			var auditLog = await _auditLogRepository.GetByIdAsync(id);

			if (auditLog == null)
				return null;

			return new AuditLogDto
			{
				Id = auditLog.Id,
				UserId = auditLog.UserId,
				UserName = auditLog.UserName,
				UserRole = auditLog.UserRole,
				Action = auditLog.Action,
				EntityName = auditLog.EntityName,
				EntityId = auditLog.EntityId,
				OldValue = auditLog.OldValue,
				NewValue = auditLog.NewValue,
				Description = auditLog.Description,
				DateCreated = auditLog.DateCreated
			};
		}

		public async Task<Guid> CreateAuditLogAsync(CreateAuditLogDto input)
		{
			if (input == null)
				throw new ArgumentNullException(_localizer["InputCannotBeNull"]);

			var auditLog = new AuditLog
			{
				UserId = input.UserId,
				UserName = input.UserName,
				UserRole = input.UserRole,
				Action = input.Action,
				EntityName = input.EntityName,
				EntityId = input.EntityId,
				OldValue = input.OldValue,
				NewValue = input.NewValue,
				Description = input.Description,
				DateCreated = DateTime.UtcNow,
				DateModified = DateTime.UtcNow
			};

			await _auditLogRepository.AddAsync(auditLog);
			await _unitOfWork.SaveChangesAsync();

			return auditLog.Id;
		}

		public async Task<bool> DeleteOldLogsAsync(int daysToKeep)
		{
			var cutoffDate = DateTime.UtcNow.AddDays(-daysToKeep);

			var oldLogs = await _auditLogRepository.GetAll()
				.Where(a => a.DateCreated < cutoffDate)
				.ToListAsync();

			foreach (var log in oldLogs)
			{
				await _auditLogRepository.DeleteAsync(log.Id);
			}

			await _unitOfWork.SaveChangesAsync();

			return true;
		}
	}
}
