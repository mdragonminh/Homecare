import axiosClient from "../config/axiosClient";

export const bookingApi = {
  // Get all bookings for current customer
  getMyBookings: async (
    pageNumber = 1,
    pageSize = 10,
    searchTerm = "",
    status = null,
    fromDate = null,
    toDate = null
  ) => {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });

    if (searchTerm) {
      params.append("searchTerm", searchTerm);
    }

    if (status !== null && status !== undefined && status !== "") {
      params.append("status", status);
    }

    if (fromDate) {
      params.append("fromDate", fromDate);
    }

    if (toDate) {
      params.append("toDate", toDate);
    }

    const response = await axiosClient.get(`/booking/my-bookings?${params}`);
    return response.data;
  },

  // Get all bookings for current technician
  getAllBookings: async (
    pageNumber = 1,
    pageSize = 10,
    searchTerm = "",
    status = null,
    fromDate = null,
    toDate = null
  ) => {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });

    if (searchTerm) {
      params.append("searchTerm", searchTerm);
    }

    if (status !== null && status !== undefined && status !== "") {
      params.append("status", status);
    }

    if (fromDate) {
      params.append("fromDate", fromDate);
    }

    if (toDate) {
      params.append("toDate", toDate);
    }

    const response = await axiosClient.get(`/booking?${params}`);
    return response.data;
  },

  // Get all bookings for admin
  getAllBookingsForAdmin: async (
    pageNumber = 1,
    pageSize = 10,
    searchTerm = "",
    status = null,
    fromDate = null,
    toDate = null
  ) => {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });

    if (searchTerm) {
      params.append("searchTerm", searchTerm);
    }

    if (status !== null && status !== undefined && status !== "") {
      params.append("status", status);
    }

    if (fromDate) {
      params.append("fromDate", fromDate);
    }

    if (toDate) {
      params.append("toDate", toDate);
    }

    try {
      const response = await axiosClient.get(`/booking/admin/all?${params}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching admin bookings:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch bookings",
      };
    }
  },

  // Get booking detail
  getBookingDetail: async (id) => {
    if (!id || id === 'undefined' || id === 'null') {
      throw new Error(`Invalid ID passed to getBookingDetail: ${id}`);
    }
    const response = await axiosClient.get(`/booking/${id}`);
    return response.data;
  },
  acceptBooking: async ({ bookingId, token }) => {
    const payload = {
      bookingId: bookingId,
      token: token,
    };

    const response = await axiosClient.post(`/booking/accept`, payload);
    return response.data;
  },
  technicianReject: async (bookingId) => {
    const response = await axiosClient.post(`/booking/${bookingId}/technician-reject`);
    return response.data;
  },

  // Complete booking
  completeBooking: async (id) => {
    const response = await axiosClient.post(`/booking/${id}/complete`);
    return response.data;
  },

  // Cancel/reject booking
  cancelBooking: async (id, reason) => {
    const response = await axiosClient.post(`/booking/${id}/cancel`, {
      reason,
    });
    return response.data;
  },

  // Update booking status
  updateBookingStatus: async (id, status, notes = "") => {
    const response = await axiosClient.put(`/booking/${id}/status`, {
      status,
      notes,
    });
    return response.data;
  },

  createFeedback: async (bookingId, rating, comment) => {
    const payload = {
      rating: rating,
      comment: comment,
    };
    const response = await axiosClient.post(
      `/booking/${bookingId}/feedback`,
      payload
    );
    return response.data;
  },

  getAllBookingsForTechnician: async (technicianId) => {
    try {
      const response = await axiosClient.get(
        `/ServiceRequest/technician-feedbacks/${technicianId}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching technician bookings:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch bookings",
      };
    }
  },

  addEquipment: async (id, data) => {
    const response = await axiosClient.post(`/booking/${id}/equipments`, data);
    return response.data;
  },

  removeEquipment: async (bookingId, bookingEquipmentId) => {
    const response = await axiosClient.delete(`/booking/${bookingId}/equipments/${bookingEquipmentId}`);
    return response.data;
  },

  submitEquipments: async (bookingId, bookingEquipmentIds) => {
    const payload = {
      bookingEquipmentIds: bookingEquipmentIds
    };
    const response = await axiosClient.post(`/booking/${bookingId}/equipments/submit`, payload);
    return response.data;
  },
};
