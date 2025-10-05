using HSP.Core.Dtos.Shared;
using HSP.Core.Enums;

namespace HSP.Core.Dtos.TechnicianProfileDto
{
    public class TechnicianProfileFilterParams : PaginationParams
    {
        public TechnicianApprovalStatus? ApprovalStatus { get; set; }
        public string? SearchTerm { get; set; }
        public int? MinExperienceYears { get; set; }
        public int? MaxExperienceYears { get; set; }
        public DateTime? CreatedFrom { get; set; }
        public DateTime? CreatedTo { get; set; }
    }
}
