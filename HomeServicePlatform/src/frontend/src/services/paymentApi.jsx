
import axiosClient from "../config/axiosClient";

const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG === "true";

export const paymentApi = {
  /**
   * Create a new payment for a booking
   * @param {Object} paymentData - Payment creation data
   * @param {string} paymentData.bookingId - Booking ID
   * @param {number} paymentData.amount - Payment amount
   * @param {number} paymentData.paymentMethod - Payment method (0: Cash, 1: BankTransfer, 2: QRCode, 3: EWallet)
   * @param {string} paymentData.description - Payment description
   * @returns {Promise} Payment response with payment details and instructions
   */
  createPayment: async (paymentData) => {
    try {
      if (ENABLE_DEBUG) {
        console.log("=== CREATE PAYMENT API ===");
        console.log("Payload:", JSON.stringify(paymentData, null, 2));
      }

      const response = await axiosClient.post("/payment", paymentData);

      if (ENABLE_DEBUG) {
        console.log("Payment created successfully:", response.data);
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error("Payment API: Error creating payment", error);
      }

      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Lỗi khi tạo thanh toán",
      };
    }
  },

  /**
   * Get payment details by ID
   * @param {string} paymentId - Payment ID
   * @returns {Promise} Payment details
   */
  getPaymentById: async (paymentId) => {
    try {
      const response = await axiosClient.get(`/payment/${paymentId}`);

      if (ENABLE_DEBUG) {
        console.log("Payment details:", response.data);
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error("Payment API: Error fetching payment", error);
      }

      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Lỗi khi lấy thông tin thanh toán",
      };
    }
  },

  /**
   * Get all payments with filtering
   * @param {Object} filters - Filter options
   * @param {number} filters.pageNumber - Page number
   * @param {number} filters.pageSize - Page size
   * @param {string} filters.bookingId - Filter by booking ID
   * @param {number} filters.status - Filter by payment status
   * @param {number} filters.paymentMethod - Filter by payment method
   * @param {string} filters.fromDate - Filter by from date
   * @param {string} filters.toDate - Filter by to date
   * @param {string} filters.searchTerm - Search term
   * @returns {Promise} Paginated payment list
   */
  getAllPayments: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.pageNumber) params.append("PageNumber", filters.pageNumber);
      if (filters.pageSize) params.append("PageSize", filters.pageSize);
      if (filters.bookingId) params.append("BookingId", filters.bookingId);
      if (filters.customerId) params.append("CustomerId", filters.customerId);
      if (filters.status !== undefined && filters.status !== null)
        params.append("Status", filters.status);
      if (filters.paymentMethod !== undefined && filters.paymentMethod !== null)
        params.append("PaymentMethod", filters.paymentMethod);
      if (filters.fromDate) params.append("FromDate", filters.fromDate);
      if (filters.toDate) params.append("ToDate", filters.toDate);
      if (filters.searchTerm) params.append("SearchTerm", filters.searchTerm);

      const response = await axiosClient.get(`/payment?${params}`);

      if (ENABLE_DEBUG) {
        console.log("Payment list:", response.data);
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error("Payment API: Error fetching payments", error);
      }

      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Lỗi khi lấy danh sách thanh toán",
      };
    }
  },

  /**
   * Get payments by booking ID
   * @param {string} bookingId - Booking ID
   * @returns {Promise} List of payments for the booking
   */
  getPaymentsByBookingId: async (bookingId) => {
    try {
      const response = await axiosClient.get(`/payment/booking/${bookingId}`);

      if (ENABLE_DEBUG) {
        console.log("Booking payments:", response.data);
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error("Payment API: Error fetching booking payments", error);
      }

      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Lỗi khi lấy thanh toán của booking",
      };
    }
  },

  /**
   * Query payment status from SePay
   * @param {string} paymentId - Payment ID
   * @returns {Promise} Updated payment details
   */
  queryPaymentStatus: async (paymentId) => {
    try {
      const response = await axiosClient.get(
        `/payment/${paymentId}/query-status`
      );

      if (ENABLE_DEBUG) {
        console.log("Payment status query result:", response.data);
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error("Payment API: Error querying payment status", error);
      }

      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Lỗi khi kiểm tra trạng thái thanh toán",
      };
    }
  },

  /**
   * Update payment status (Admin only)
   * @param {Object} statusData - Status update data
   * @param {string} statusData.paymentId - Payment ID
   * @param {number} statusData.status - New status
   * @param {string} statusData.transactionId - Transaction ID
   * @param {string} statusData.failureReason - Failure reason
   * @returns {Promise} Update result
   */
  updatePaymentStatus: async (statusData) => {
    try {
      const response = await axiosClient.put("/payment/status", statusData);

      if (ENABLE_DEBUG) {
        console.log("Payment status updated:", response.data);
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error("Payment API: Error updating payment status", error);
      }

      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Lỗi khi cập nhật trạng thái thanh toán",
      };
    }
  },

  /**
   * Refund a payment (Admin only)
   * @param {Object} refundData - Refund data
   * @param {string} refundData.paymentId - Payment ID
   * @param {string} refundData.reason - Refund reason
   * @returns {Promise} Refund result
   */
  refundPayment: async (refundData) => {
    try {
      const response = await axiosClient.post("/payment/refund", refundData);

      if (ENABLE_DEBUG) {
        console.log("Payment refunded:", response.data);
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error("Payment API: Error refunding payment", error);
      }

      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Lỗi khi hoàn tiền",
      };
    }
  },
};

// Payment method enum
export const PaymentMethod = {
  Cash: 0,
  BankTransfer: 1,
  QRCode: 2,
  EWallet: 3,
};

// Payment status enum
export const PaymentStatus = {
  Pending: 0,
  Processing: 1,
  Completed: 2,
  Failed: 3,
  Cancelled: 4,
  Refunded: 5,
};

export const BookingEquipmentStatus = {
  Draft: 0,
  Submitted: 1,
  Paid: 2,
  Approved: 3
};

// Helper functions
export const getPaymentMethodText = (method) => {
  const methods = {
    0: "Tiền mặt",
    1: "Chuyển khoản ngân hàng",
    2: "Mã QR",
    3: "Ví điện tử",
  };
  return methods[method] || "Không xác định";
};

export const getPaymentStatusText = (status) => {
  const statuses = {
    0: "Chờ thanh toán",
    1: "Đang xử lý",
    2: "Đã thanh toán",
    3: "Thất bại",
    4: "Đã hủy",
    5: "Đã hoàn tiền",
  };
  return statuses[status] || "Không xác định";
};

export const getPaymentStatusColor = (status) => {
  const colors = {
    0: "warning", // Pending - yellow
    1: "info", // Processing - blue
    2: "success", // Completed - green
    3: "error", // Failed - red
    4: "default", // Cancelled - gray
    5: "secondary", // Refunded - purple
  };
  return colors[status] || "default";
};

export const getEquipmentStatusText = (status) => {
    const statuses = {
        0: "Nháp (Chưa gửi)",
        1: "Đã gửi khách (Chờ thanh toán)",
        2: "Đã thanh toán",
        3: "Đã xuất kho"
    };
    return statuses[status] || "N/A";
};

export const getEquipmentStatusColor = (status) => {
    const colors = {
        0: "text-gray-500 bg-gray-100", // Draft
        1: "text-amber-600 bg-amber-50", // Submitted
        2: "text-green-600 bg-green-50", // Paid
        3: "text-blue-600 bg-blue-50",   // Approved
    };
    return colors[status] || "";
};
