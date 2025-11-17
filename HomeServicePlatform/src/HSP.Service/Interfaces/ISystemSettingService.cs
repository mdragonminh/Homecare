using HSP.Core.Dtos.SystemSettingDto;

namespace HSP.Service.Interfaces
{
	public interface ISystemSettingService
	{
		Task<IEnumerable<SystemSettingDto>> GetAllSettingsAsync();
		Task<Dictionary<string, IEnumerable<SystemSettingDto>>> GetSettingsByGroupAsync();
		Task<SystemSettingDto?> GetSettingByKeyAsync(string key);
		Task<Guid> CreateSettingAsync(Guid userId, CreateSystemSettingDto input);
		Task<bool> UpdateSettingAsync(Guid userId, string key, UpdateSystemSettingDto input);
		Task<bool> UpdateSettingByIdAsync(Guid userId, Guid id, UpdateSystemSettingDto input);
		Task<bool> DeleteSettingAsync(Guid userId, Guid id);
		
		Task<string> GetSettingValueAsync(string key, string defaultValue = "");
		Task<int> GetSettingValueAsIntAsync(string key, int defaultValue = 0);
		Task<bool> GetSettingValueAsBoolAsync(string key, bool defaultValue = false);
		Task<decimal> GetSettingValueAsDecimalAsync(string key, decimal defaultValue = 0);
	}
}