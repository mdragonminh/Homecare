namespace HSP.Core.Constants.SystemSettings
{
    public record SystemSettingDefinition(
        string Key,
        string DefaultValue,
        string Group,
        string? Description = null
    );
}
