using HSP.Core.Dtos.SystemSettingDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace HSP.Service.Implementations.Internal
{
	public class SystemSettingService : BaseService, ISystemSettingService
	{
		private readonly IRepository<SystemSetting, Guid> _systemSettingRepository;

		public SystemSettingService(
			IRepository<SystemSetting, Guid> systemSettingRepository,
			IUnitOfWork unitOfWork,
			IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
		{
			_systemSettingRepository = systemSettingRepository;
		}

		public async Task<IEnumerable<SystemSettingDto>> GetAllSettingsAsync()
		{
			var settings = await _systemSettingRepository.GetAll()
				.OrderBy(s => s.Group)
				.ThenBy(s => s.Key)
				.Select(s => new SystemSettingDto
				{
					Id = s.Id,
					Key = s.Key,
					Value = s.IsSensitive ? "***" : s.Value,
					Description = s.Description,
					Group = s.Group,
					IsSensitive = s.IsSensitive,
					DateCreated = s.DateCreated,
					DateModified = s.DateModified
				})
				.ToListAsync();

			return settings;
		}

		public async Task<Dictionary<string, IEnumerable<SystemSettingDto>>> GetSettingsByGroupAsync()
		{
			var settings = await GetAllSettingsAsync();
			var grouped = settings
				.GroupBy(s => s.Group ?? "General")
				.ToDictionary(g => g.Key, g => g.AsEnumerable());

			return grouped;
		}

		public async Task<SystemSettingDto?> GetSettingByKeyAsync(string key)
		{
			var setting = await _systemSettingRepository.GetAll()
				.FirstOrDefaultAsync(s => s.Key == key);

			if (setting == null)
				return null;

			return new SystemSettingDto
			{
				Id = setting.Id,
				Key = setting.Key,
				Value = setting.IsSensitive ? "***" : setting.Value,
				Description = setting.Description,
				Group = setting.Group,
				IsSensitive = setting.IsSensitive,
				DateCreated = setting.DateCreated,
				DateModified = setting.DateModified
			};
		}

	public async Task<bool> UpdateSettingAsync(Guid userId, string key, UpdateSystemSettingDto input)
	{
		if (input == null)
			throw new ArgumentNullException(_localizer["InputCannotBeNull"]);

		var setting = await _systemSettingRepository.GetAll()
			.FirstOrDefaultAsync(s => s.Key == key);

		if (setting == null)
			throw new KeyNotFoundException("Setting not found");

		var flag = false;
		if (setting.Value != input.Value)
		{
			setting.Value = input.Value;
			flag = true;
		}
		if (!string.IsNullOrEmpty(input.Description) && setting.Description != input.Description)
		{
			setting.Description = input.Description;
			flag = true;
		}

		if (flag)
		{
			setting.DateModified = DateTime.UtcNow;
			setting.ModifiedBy = userId;
			_systemSettingRepository.Update(setting);
			await _unitOfWork.SaveChangesAsync();
		}

		return true;
	}

	public async Task<bool> UpdateSettingByIdAsync(Guid userId, Guid id, UpdateSystemSettingDto input)
	{
		if (input == null)
			throw new ArgumentNullException(_localizer["InputCannotBeNull"]);

		var setting = await _systemSettingRepository.GetByIdAsync(id);

		if (setting == null)
			throw new KeyNotFoundException("Setting not found");

		var flag = false;
		if (setting.Value != input.Value)
		{
			setting.Value = input.Value;
			flag = true;
		}
		if (!string.IsNullOrEmpty(input.Description) && setting.Description != input.Description)
		{
			setting.Description = input.Description;
			flag = true;
		}

		if (flag)
		{
			setting.DateModified = DateTime.UtcNow;
			setting.ModifiedBy = userId;
			_systemSettingRepository.Update(setting);
			await _unitOfWork.SaveChangesAsync();
		}

		return true;
	}

	public async Task<bool> DeleteSettingAsync(Guid userId, Guid id)
	{
		var setting = await _systemSettingRepository.GetByIdAsync(id);

		if (setting == null)
			throw new KeyNotFoundException("Setting not found");

		await _systemSettingRepository.DeleteAsync(id);
		await _unitOfWork.SaveChangesAsync();

		return true;
	}

	public async Task<string> GetSettingValueAsync(string key, string defaultValue = "")
	{
		var setting = await _systemSettingRepository.GetAll()
			.FirstOrDefaultAsync(s => s.Key == key);

		return setting?.Value ?? defaultValue;
	}

	public async Task<int> GetSettingValueAsIntAsync(string key, int defaultValue = 0)
	{
		var value = await GetSettingValueAsync(key);
		return int.TryParse(value, out var result) ? result : defaultValue;
	}

	public async Task<bool> GetSettingValueAsBoolAsync(string key, bool defaultValue = false)
	{
		var value = await GetSettingValueAsync(key);
		return bool.TryParse(value, out var result) ? result : defaultValue;
	}

	public async Task<decimal> GetSettingValueAsDecimalAsync(string key, decimal defaultValue = 0)
	{
		var value = await GetSettingValueAsync(key);
		return decimal.TryParse(value, out var result) ? result : defaultValue;
	}
	}
}
