using HSP.Core.Dtos.SystemSettingDto;

namespace HSP.Service.Interfaces
{
	public interface ISystemSettingService
	{
		Task<IEnumerable<SystemSettingDto>> GetAllSettingsAsync();
		Task<Dictionary<string, IEnumerable<SystemSettingDto>>> GetSettingsByGroupAsync();
		Task<SystemSettingDto?> GetSettingByKeyAsync(string key);
		Task<Guid> CreateSystemSettingAsync(CreateSystemSettingDto input);
		Task<bool> UpdateSettingAsync(Guid userId, string key, UpdateSystemSettingDto input);
		Task<bool> UpdateSettingByIdAsync(Guid userId, Guid id, UpdateSystemSettingDto input);
		Task<bool> DeleteSettingAsync(Guid userId, Guid id); Task<string> GetSettingValueAsync(string key, string defaultValue = "");
        Task<T> GetValueAsync<T>(string key);
    }
}