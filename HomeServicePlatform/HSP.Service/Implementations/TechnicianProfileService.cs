using HSP.Core.Dtos.Shared;
using HSP.Core.Dtos.TechnicianProfileDto;
using HSP.Core.Interfaces.DataAccess;
using HSP.Service.Interfaces;

namespace HSP.Service.Implementations
{
    public class TechnicianProfileService : ITechnicianProfileService
    {
        private readonly IUnitOfWork _unitOfWork;

        public TechnicianProfileService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<PagedList<TechnicianProfileResponseDto>> GetTechniciansAsync(TechnicianProfileFilterParams filterParams)
        {
            return await _unitOfWork.TechnicianProfiles.GetTechniciansAsync(filterParams);
        }

        public async Task<TechnicianProfileResponseDto?> GetTechnicianByIdAsync(Guid id)
        {
            return await _unitOfWork.TechnicianProfiles.GetTechnicianByIdAsync(id);
        }

        public async Task<bool> ApproveTechnicianAsync(Guid technicianProfileId, string approvedBy)
        {
            var result = await _unitOfWork.TechnicianProfiles.ApproveTechnicianAsync(technicianProfileId, approvedBy);
            if (result)
            {
                await _unitOfWork.SaveChangesAsync();
            }
            return result;
        }

        public async Task<bool> RejectTechnicianAsync(Guid technicianProfileId, string rejectedBy)
        {
            var result = await _unitOfWork.TechnicianProfiles.RejectTechnicianAsync(technicianProfileId, rejectedBy);
            if (result)
            {
                await _unitOfWork.SaveChangesAsync();
            }
            return result;
        }
    }
}
