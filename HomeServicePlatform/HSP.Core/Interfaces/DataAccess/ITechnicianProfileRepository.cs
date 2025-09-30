using HSP.Core.Dtos.Shared;
using HSP.Core.Dtos.TechnicianProfileDto;
using HSP.Core.Entities;

namespace HSP.Core.Interfaces.DataAccess
{
    public interface ITechnicianProfileRepository : IRepository<TechnicianProfile, Guid>
    {
        Task<PagedList<TechnicianProfileResponseDto>> GetTechniciansAsync(TechnicianProfileFilterParams filterParams);
        Task<TechnicianProfileResponseDto?> GetTechnicianByIdAsync(Guid id);
        Task<TechnicianProfile?> GetTechnicianProfileByUserIdAsync(Guid userId);
        Task<bool> ApproveTechnicianAsync(Guid technicianProfileId, string approvedBy);
        Task<bool> RejectTechnicianAsync(Guid technicianProfileId, string rejectedBy);
    }
}
