import axiosClient from "../config/axiosClient";

const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG === "true";

export const accountApi = {
  // Get all accounts with filtering and pagination
  getAccounts: async (filter = {}) => {
    try {
      const params = new URLSearchParams();

      if (filter.searchTerm) params.append("SearchTerm", filter.searchTerm);
      if (filter.role) params.append("Role", filter.role);
      if (filter.isActive !== undefined)
        params.append("IsActive", filter.isActive);
      if (filter.department) params.append("Department", filter.department);
      if (filter.pageNumber) params.append("PageNumber", filter.pageNumber);
      if (filter.pageSize) params.append("PageSize", filter.pageSize);

      const res = await axiosClient.get(
        `/AccountManagement?${params.toString()}`
      );

      if (ENABLE_DEBUG) console.log("Get accounts success:", res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Get accounts error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi lấy danh sách tài khoản",
      };
    }
  },

  // Get account by ID
  getAccountById: async (accountId) => {
    try {
      const res = await axiosClient.get(`/AccountManagement/${accountId}`);

      if (ENABLE_DEBUG) console.log("Get account by ID success:", res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Get account by ID error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi lấy thông tin tài khoản",
      };
    }
  },

  // Create new management account
  createAccount: async (accountData) => {
    try {
      const res = await axiosClient.post("/AccountManagement", accountData);

      if (ENABLE_DEBUG) console.log("Create account success:", res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Create account error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi tạo tài khoản",
      };
    }
  },

  // Update account
  updateAccount: async (accountId, updateData) => {
    try {
      const res = await axiosClient.put(
        `/AccountManagement/${accountId}`,
        updateData
      );

      if (ENABLE_DEBUG) console.log("Update account success:", res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Update account error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi cập nhật tài khoản",
      };
    }
  },

  // Disable account
  disableAccount: async (accountId, disableData) => {
    try {
      const res = await axiosClient.patch(
        `/AccountManagement/${accountId}/disable`,
        disableData
      );

      if (ENABLE_DEBUG) console.log("Disable account success:", res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Disable account error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi vô hiệu hóa tài khoản",
      };
    }
  },

  // Enable account
  enableAccount: async (accountId) => {
    try {
      const res = await axiosClient.patch(
        `/AccountManagement/${accountId}/enable`
      );

      if (ENABLE_DEBUG) console.log("Enable account success:", res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Enable account error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi kích hoạt tài khoản",
      };
    }
  },

  // Delete account
  deleteAccount: async (accountId) => {
    try {
      const res = await axiosClient.delete(`/AccountManagement/${accountId}`);

      if (ENABLE_DEBUG) console.log("Delete account success:", res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Delete account error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi xóa tài khoản",
      };
    }
  },

  // Get accounts by role
  getAccountsByRole: async (role) => {
    try {
      const res = await axiosClient.get(`/AccountManagement/by-role/${role}`);

      if (ENABLE_DEBUG) console.log("Get accounts by role success:", res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Get accounts by role error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi lấy danh sách tài khoản theo vai trò",
      };
    }
  },

  // Get account statistics
  getAccountStatistics: async () => {
    try {
      const res = await axiosClient.get("/AccountManagement/statistics");

      if (ENABLE_DEBUG)
        console.log("Get account statistics success:", res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Get account statistics error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi lấy thống kê tài khoản",
      };
    }
  },

  // Get customers (from CustomerProfile)
  getCustomers: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.pageNumber)
        queryParams.append("PageNumber", params.pageNumber);
      if (params.pageSize) queryParams.append("PageSize", params.pageSize);
      if (params.searchTerm)
        queryParams.append("SearchTerm", params.searchTerm);

      const res = await axiosClient.get(
        `/CustomerProfile?${queryParams.toString()}`
      );

      if (ENABLE_DEBUG) console.log("Get customers success:", res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Get customers error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi lấy danh sách khách hàng",
      };
    }
  },

  // Get technicians (from adminApi for consistency)
  getTechnicians: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.pageNumber)
        queryParams.append("PageNumber", params.pageNumber);
      if (params.pageSize) queryParams.append("PageSize", params.pageSize);
      if (params.searchTerm)
        queryParams.append("SearchTerm", params.searchTerm);

      const res = await axiosClient.get(
        `/TechnicianManagement/technicians?${queryParams.toString()}`
      );

      if (ENABLE_DEBUG) console.log("Get technicians success:", res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Get technicians error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi lấy danh sách kỹ thuật viên",
      };
    }
  },
};
