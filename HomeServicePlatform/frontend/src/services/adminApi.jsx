import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeader = () => {
  const token = localStorage.getItem("jwtToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const adminApi = {
  createOperator: async ({ email, username, password }) => {
    try {
      const res = await axios.post(
        `${API_URL}/Authentication/create-operator`,
        { email, username, password },
        { headers: { ...getAuthHeader() } }
      );
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Create operator error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          "Tạo tài khoản operator thất bại",
      };
    }
  },

  // Technician Management APIs
  getTechnicians: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.pageNumber) queryParams.append('PageNumber', params.pageNumber);
      if (params.pageSize) queryParams.append('PageSize', params.pageSize);
      if (params.approvalStatus !== undefined) queryParams.append('ApprovalStatus', params.approvalStatus);
      if (params.searchTerm) queryParams.append('SearchTerm', params.searchTerm);
      if (params.minExperienceYears) queryParams.append('MinExperienceYears', params.minExperienceYears);
      if (params.maxExperienceYears) queryParams.append('MaxExperienceYears', params.maxExperienceYears);

      const res = await axios.get(
        `${API_URL}/TechnicianManagement/technicians?${queryParams.toString()}`,
        { headers: { ...getAuthHeader() } }
      );
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Get technicians error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Lấy danh sách kỹ thuật viên thất bại",
      };
    }
  },

  getTechnicianById: async (id) => {
    try {
      const res = await axios.get(
        `${API_URL}/TechnicianManagement/technicians/${id}`,
        { headers: { ...getAuthHeader() } }
      );
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Get technician error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Lấy thông tin kỹ thuật viên thất bại",
      };
    }
  },

  approveTechnician: async (id) => {
    try {
      const res = await axios.post(
        `${API_URL}/TechnicianManagement/technicians/${id}/approve`,
        {},
        { headers: { ...getAuthHeader() } }
      );
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Approve technician error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Duyệt kỹ thuật viên thất bại",
      };
    }
  },

  rejectTechnician: async (id) => {
    try {
      const res = await axios.post(
        `${API_URL}/TechnicianManagement/technicians/${id}/reject`,
        {},
        { headers: { ...getAuthHeader() } }
      );
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Reject technician error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Từ chối kỹ thuật viên thất bại",
      };
    }
  },

  batchApproveTechnicians: async (technicianIds) => {
    try {
      const res = await axios.post(
        `${API_URL}/TechnicianManagement/technicians/batch-approve`,
        technicianIds,
        { 
          headers: { 
            ...getAuthHeader(), 
            'Content-Type': 'application/json' 
          } 
        }
      );
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Batch approve technicians error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Duyệt hàng loạt kỹ thuật viên thất bại",
      };
    }
  },

  batchRejectTechnicians: async (technicianIds) => {
    try {
      const res = await axios.post(
        `${API_URL}/TechnicianManagement/technicians/batch-reject`,
        technicianIds,
        { 
          headers: { 
            ...getAuthHeader(), 
            'Content-Type': 'application/json' 
          } 
        }
      );
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Batch reject technicians error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Từ chối hàng loạt kỹ thuật viên thất bại",
      };
    }
  },
};
