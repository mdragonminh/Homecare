namespace HSP.Core.Constants.SystemSettings
{
    public static class SystemSettingRegistry
    {
        public static class Keys
        {
            public const string TechnicianResponseTimeoutSeconds = "TechnicianResponseTimeoutSeconds";
            public const string TechnicianInvitationExpirationSeconds = "TechnicianInvitationExpirationSeconds";
            public const string EmailTokenLifespanMinutes = "EmailTokenLifespanMinutes";
            public const string DefaultServiceBasePrice = "DefaultServiceBasePrice";
            public const string TechnicianSearchRadiusKm = "TechnicianSearchRadiusKm";
            public const string TechnicianMinRating = "TechnicianMinRating";
        }

        public static class Groups
        {
            public const string TechnicianMatching = "TechnicianMatching";
            public const string Security = "Security";
            public const string ServiceManagement = "ServiceManagement";
        }

        public static readonly Dictionary<string, SystemSettingDefinition> All = new()
        {
            {
                Keys.TechnicianResponseTimeoutSeconds,
                new SystemSettingDefinition(
                    Keys.TechnicianResponseTimeoutSeconds,
                    DefaultValue: "10",
                    Group: Groups.TechnicianMatching,
                    Description: "Thời gian (giây) cho kỹ thuật viên phản hồi yêu cầu"
                )
            },
            {
                Keys.TechnicianInvitationExpirationSeconds,
                new SystemSettingDefinition(
                    Keys.TechnicianInvitationExpirationSeconds,
                    DefaultValue: "15",
                    Group: Groups.TechnicianMatching,
                    Description: "Thời gian sống (TTL) của lời mời kỹ thuật viên"
                )
            },
            {
                Keys.TechnicianSearchRadiusKm,
                new SystemSettingDefinition(
                    Keys.TechnicianSearchRadiusKm,
                    DefaultValue: "10",  
                    Group: Groups.TechnicianMatching,
                    Description: "Bán kính (km) để tìm kỹ thuật viên gần khách hàng"
                )
            },
            {
                Keys.EmailTokenLifespanMinutes,
                new SystemSettingDefinition(
                    Keys.EmailTokenLifespanMinutes,
                    DefaultValue: "10",
                    Group: Groups.Security,
                    Description: "Thời gian sống của email xác thực (phút)"
                )
            },
            {
                Keys.DefaultServiceBasePrice,
                new SystemSettingDefinition(
                    Keys.DefaultServiceBasePrice,
                    DefaultValue: "100000",
                    Group: Groups.ServiceManagement,
                    Description: "Giá sàn tối thiểu cho một dịch vụ gia đình"
                )
            },
            {
                Keys.TechnicianMinRating,
                new SystemSettingDefinition(
                    Keys.TechnicianMinRating,
                    DefaultValue: "3",
                    Group: Groups.TechnicianMatching,
                    Description: "Điểm đánh giá tối thiểu của kỹ thuật viên để nhận job"
                )
            },

        };
    }
}
