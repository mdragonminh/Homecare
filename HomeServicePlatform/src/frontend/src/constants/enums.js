// Technician Approval Status Enum (must match backend HSP.Core.Enums.TechnicianApprovalStatus)
export const TechnicianApprovalStatus = {
  Pending: 0,
  Approved: 1,
  Rejected: 2
};

// Status labels for UI
export const TechnicianApprovalStatusLabels = {
  [TechnicianApprovalStatus.Pending]: "Chờ duyệt",
  [TechnicianApprovalStatus.Approved]: "Đã duyệt", 
  [TechnicianApprovalStatus.Rejected]: "Bị từ chối"
};

// Status colors for UI
export const TechnicianApprovalStatusColors = {
  [TechnicianApprovalStatus.Pending]: "orange",
  [TechnicianApprovalStatus.Approved]: "green",
  [TechnicianApprovalStatus.Rejected]: "red"
};
