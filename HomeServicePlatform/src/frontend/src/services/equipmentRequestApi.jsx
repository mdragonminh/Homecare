import axiosClient from "../config/axiosClient";

export const BookingEquipmentStatus = {
  Draft: 0,
  Submitted: 1,
  Paid: 2,
  AwaitingDelivery: 3,
  Delivered: 4,
};

export const getEquipmentRequestStatusText = (status) => {
  const statusMap = {
    [BookingEquipmentStatus.Draft]: "Nháp",
    [BookingEquipmentStatus.Submitted]: "Đã gửi khách",
    [BookingEquipmentStatus.Paid]: "Đã thanh toán",
    [BookingEquipmentStatus.AwaitingDelivery]: "Đang giao hàng",
    [BookingEquipmentStatus.Delivered]: "Đã giao",
  };
  return statusMap[status] || "Không xác định";
};

export const getEquipmentRequestStatusColor = (status) => {
  const colorMap = {
    [BookingEquipmentStatus.Draft]: "bg-gray-100 text-gray-700 border-gray-300",
    [BookingEquipmentStatus.Submitted]: "bg-blue-100 text-blue-700 border-blue-300",
    [BookingEquipmentStatus.Paid]: "bg-green-100 text-green-700 border-green-300",
    [BookingEquipmentStatus.AwaitingDelivery]: "bg-yellow-100 text-yellow-700 border-yellow-300",
    [BookingEquipmentStatus.Delivered]: "bg-emerald-100 text-emerald-700 border-emerald-300",
  };
  return colorMap[status] || "bg-gray-100 text-gray-700 border-gray-300";
};

const equipmentRequestApi = {
  // Get all equipment requests with pagination
  getAllRequests: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status !== undefined) params.append("status", filters.status);
      if (filters.bookingId) params.append("bookingId", filters.bookingId);
      if (filters.technicianId) params.append("technicianId", filters.technicianId);
      params.append("pageNumber", filters.pageNumber || 1);
      params.append("pageSize", filters.pageSize || 20);

      const response = await axiosClient.get(`/equipmentrequest?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching equipment requests:", error);
      throw error;
    }
  },

  // Get equipment request detail by ID
  getRequestDetail: async (requestId) => {
    try {
      const response = await axiosClient.get(`/equipmentrequest/${requestId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching equipment request detail:", error);
      throw error;
    }
  },

  // Approve equipment request (Equipment Manager)
  approveRequest: async (bookingId, bookingEquipmentIds) => {
    try {
      const response = await axiosClient.post("/equipmentrequest/approve", {
        bookingId,
        bookingEquipmentIds,
      });
      return response.data;
    } catch (error) {
      console.error("Error approving equipment request:", error);
      throw error;
    }
  },

  // Confirm receipt (Technician)
  confirmReceipt: async (bookingId, bookingEquipmentIds) => {
    try {
      const response = await axiosClient.post("/equipmentrequest/confirm-receipt", {
        bookingId,
        bookingEquipmentIds,
      });
      return response.data;
    } catch (error) {
      console.error("Error confirming receipt:", error);
      throw error;
    }
  },
};

export default equipmentRequestApi;
