using HSP.Core.Dtos.Shared;
using HSP.Core.Dtos.TechnicianProfileDto;

namespace HSP.Service.Interfaces
{
    public interface ITechnicianProfileService
    {
        Task<PagedList<TechnicianProfileResponseDto>> GetTechniciansAsync(TechnicianProfileFilterParams filterParams);
        Task<TechnicianProfileResponseDto?> GetTechnicianByIdAsync(Guid id);
        Task<bool> ApproveTechnicianAsync(Guid technicianProfileId, string approvedBy);
        Task<bool> RejectTechnicianAsync(Guid technicianProfileId, string rejectedBy);
    }
}
