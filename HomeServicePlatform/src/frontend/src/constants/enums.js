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

// Booking Status Enum (must match backend HSP.Core.Enums.BookingStatus)
export const BookingStatus = {
  Pending: 0,
  Confirmed: 1,
  TechnicianOnTheWay: 2,
  InProgress: 3,
  Completed: 4,
  Cancelled: 5
};

// Booking Status labels for UI
export const BookingStatusLabels = {
  [BookingStatus.Pending]: "Chờ xử lý",
  [BookingStatus.Confirmed]: "Đã xác nhận",
  [BookingStatus.TechnicianOnTheWay]: "Đang đến",
  [BookingStatus.InProgress]: "Đang thực hiện",
  [BookingStatus.Completed]: "Hoàn thành",
  [BookingStatus.Cancelled]: "Đã hủy"
};

// Booking Status colors for UI
export const BookingStatusColors = {
  [BookingStatus.Pending]: "orange",
  [BookingStatus.Confirmed]: "blue",
  [BookingStatus.TechnicianOnTheWay]: "indigo",
  [BookingStatus.InProgress]: "purple",
  [BookingStatus.Completed]: "green",
  [BookingStatus.Cancelled]: "red"
};

export const FeedbackSource = {
  Customer: 1,
  Technician: 2,
};
