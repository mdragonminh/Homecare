using HSP.Core.Dtos.EquipmentRequest;
using HSP.Core.Enums;

namespace HSP.Service.Interfaces
{
    public interface IEquipmentRequestService
    {
        Task<(List<EquipmentRequestDto> Items, int TotalCount, int TotalPages)> GetAllEquipmentRequestsAsync(EquipmentRequestFilterDto filter);
        Task<EquipmentRequestDetailDto?> GetEquipmentRequestDetailAsync(Guid requestId);
        Task<bool> ApproveEquipmentRequestAsync(ApproveEquipmentRequestDto input, Guid managerId);
        Task<bool> ConfirmReceiptAsync(ConfirmReceiptDto input, Guid technicianUserId);
    }
}
