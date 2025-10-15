import axiosClient from "../config/axiosClient";

export const bookingApi = {
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

  // Get booking detail
  getBookingDetail: async (id) => {
    const response = await axiosClient.get(`/booking/${id}`);
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
};
