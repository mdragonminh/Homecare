import axiosClient from "../config/axiosClient";

const BASE_URL = "/HomeService";

export const homeApi = {
  listHomeService: async (params) => {
    try {
      const res = await axiosClient.get(`${BASE_URL}/services`, { params });
      return { success: true, data: res.data };
    } catch (err) {
      console.error("List failed:", err);
      return { success: false, message: err.response?.data?.message || "Lấy danh sách dịch vụ thất bại" };
    }
  },

  getHomeById: async (id) => {
    try {
      const res = await axiosClient.get(`${BASE_URL}`, { params: { id } });
      return res.data;
    } catch (err) {
      console.error("Get detail failed:", err);
      throw err;
    }
  },

  getHomeServiceById: async (id) => {
    try {
      const res = await axiosClient.get(`${BASE_URL}`, { params: { id } });
      return { success: true, data: res.data };
    } catch (err) {
      console.error("Get service detail failed:", err);
      return { success: false, message: err.response?.data?.message || "Lấy chi tiết dịch vụ thất bại" };
    }
  },

  createHomeService: async (data) => {
    try {
      const res = await axiosClient.post(`${BASE_URL}`, data);
      return { success: true, data: res.data };
    } catch (err) {
      console.error("Create failed:", err);
      return { success: false, message: err.response?.data?.message || "Tạo dịch vụ thất bại" };
    }
  },

  updateHomeService: async (id, data) => {
    try {
      const res = await axiosClient.put(`${BASE_URL}/${id}`, data);
      return { success: true, data: res.data };
    } catch (err) {
      console.error("Update failed:", err);
      return { success: false, message: err.response?.data?.message || "Cập nhật dịch vụ thất bại" };
    }
  },

  deleteHomeService: async (id) => {
    try {
      const res = await axiosClient.delete(`${BASE_URL}/${id}`);
      return { success: true, data: res.data };
    } catch (err) {
      console.error("Delete failed:", err);
      return { success: false, message: err.response?.data?.message || "Xóa dịch vụ thất bại" };
    }
  },
};
