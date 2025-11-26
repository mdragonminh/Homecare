import axiosClient from "../config/axiosClient";

const BASE_URL = "/AuditLog";

// Audit Action Enum (matching backend)
export const AuditAction = {
  Create: 0,
  Update: 1,
  Delete: 2,
  Login: 3,
  Logout: 4,
  View: 5,
  Export: 6,
  Other: 99,
};

export const auditLogApi = {
  /**
   * Get all audit logs with filtering
   * @param {Object} filters - Filter options
   * @param {number} filters.pageNumber - Page number
   * @param {number} filters.pageSize - Page size
   * @param {string} filters.userRole - Filter by user role
   * @param {string} filters.userId - Filter by user ID
   * @param {number} filters.action - Filter by action type
   * @param {string} filters.entityName - Filter by entity name
   * @param {string} filters.fromDate - Filter by from date
   * @param {string} filters.toDate - Filter by to date
   * @param {string} filters.searchTerm - Search term
   * @returns {Promise} Paginated audit log list
   */
  getAllAuditLogs: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.pageNumber) params.append("PageNumber", filters.pageNumber);
      if (filters.pageSize) params.append("PageSize", filters.pageSize);
      if (filters.userRole) params.append("UserRole", filters.userRole);
      if (filters.userId) params.append("UserId", filters.userId);
      if (filters.action !== undefined && filters.action !== null)
        params.append("Action", filters.action);
      if (filters.entityName) params.append("EntityName", filters.entityName);
      if (filters.fromDate) params.append("FromDate", filters.fromDate);
      if (filters.toDate) params.append("ToDate", filters.toDate);
      if (filters.searchTerm) params.append("SearchTerm", filters.searchTerm);

      const res = await axiosClient.get(`${BASE_URL}?${params}`);
      return { success: true, data: res.data };
    } catch (err) {
      console.error("Get audit logs failed:", err);
      return {
        success: false,
        message: err.response?.data?.message || "Lỗi khi lấy danh sách nhật ký",
      };
    }
  },

  /**
   * Get audit log by ID
   * @param {string} id - Audit log ID
   * @returns {Promise} Audit log details
   */
  getAuditLogById: async (id) => {
    try {
      const res = await axiosClient.get(`${BASE_URL}/${id}`);
      return { success: true, data: res.data };
    } catch (err) {
      console.error("Get audit log failed:", err);
      return {
        success: false,
        message: err.response?.data?.message || "Lỗi khi lấy thông tin nhật ký",
      };
    }
  },

  /**
   * Delete old audit logs (cleanup)
   * @param {number} daysToKeep - Number of days to keep logs
   * @returns {Promise} Success response
   */
  deleteOldLogs: async (daysToKeep = 90) => {
    try {
      const res = await axiosClient.delete(
        `${BASE_URL}/cleanup?daysToKeep=${daysToKeep}`
      );
      return { success: true, data: res.data };
    } catch (err) {
      console.error("Delete old logs failed:", err);
      return {
        success: false,
        message: err.response?.data?.message || "Lỗi khi xóa nhật ký cũ",
      };
    }
  },
};

/**
 * Get action text by action enum value
 * @param {number} action - Action enum value
 * @returns {string} Action text
 */
export const getActionText = (action) => {
  switch (action) {
    case AuditAction.Create:
      return "Tạo mới";
    case AuditAction.Update:
      return "Cập nhật";
    case AuditAction.Delete:
      return "Xóa";
    case AuditAction.Login:
      return "Đăng nhập";
    case AuditAction.Logout:
      return "Đăng xuất";
    case AuditAction.View:
      return "Xem";
    case AuditAction.Export:
      return "Xuất dữ liệu";
    case AuditAction.Other:
      return "Khác";
    default:
      return "Không xác định";
  }
};

/**
 * Get action color class by action enum value
 * @param {number} action - Action enum value
 * @returns {string} Tailwind color class
 */
export const getActionColor = (action) => {
  switch (action) {
    case AuditAction.Create:
      return "green";
    case AuditAction.Update:
      return "blue";
    case AuditAction.Delete:
      return "red";
    case AuditAction.Login:
      return "purple";
    case AuditAction.Logout:
      return "default";
    case AuditAction.View:
      return "cyan";
    case AuditAction.Export:
      return "orange";
    default:
      return "default";
  }
};
