using HSP.Core.Dtos.ServiceRequestDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Dtos.TechnicianProfileDto;

namespace HSP.Service.Interfaces
{
    public interface ITechnicianProfileService
    {
        Task<Guid> GetTechnicianIdByUserId(Guid userId);
        Task<PagedList<TechnicianProfileResponseDto>> GetTechniciansAsync(TechnicianProfileFilterParams filterParams);
        Task<TechnicianProfileResponseDto?> GetTechnicianByIdAsync(Guid technicianId);
        Task<bool> ApproveTechnicianAsync(Guid technicianProfileId, string approvedBy);
        Task<bool> RejectTechnicianAsync(Guid technicianProfileId, string rejectedBy, string rejectionReason);
        Task<bool> ApproveTechnicianWithNotificationAsync(Guid technicianProfileId, string approvedBy);
        Task<bool> RejectTechnicianWithNotificationAsync(Guid technicianProfileId, string rejectedBy, string rejectionReason);
        Task<bool> UpdateTechnicianProfileAsync(Guid userId, UpdateTechnicianProfileDto input);
        Task<IEnumerable<FeaturedTechnicianDto>> GetFeaturedTechniciansAsync(int count = 4);
        Task<bool> ResendTechnicianApplication(Guid userId);
    }
}
