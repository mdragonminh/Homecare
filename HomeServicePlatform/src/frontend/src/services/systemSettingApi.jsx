import axiosClient from "../config/axiosClient";

const BASE_URL = "/SystemSetting";

export const systemSettingApi = {
  getAllSettings: async () => {
    try {
      const res = await axiosClient.get(`${BASE_URL}`);
      return { success: true, data: res.data };
    } catch (err) {
      console.error("Get all settings failed:", err);
      return { success: false, message: err.response?.data?.message || "Lấy cài đặt thất bại" };
    }
  },

  getSettingsByGroup: async () => {
    try {
      const res = await axiosClient.get(`${BASE_URL}/grouped`);
      return { success: true, data: res.data };
    } catch (err) {
      console.error("Get settings by group failed:", err);
      return { success: false, message: err.response?.data?.message || "Lấy cài đặt thất bại" };
    }
  },

  getSettingByKey: async (key) => {
    try {
      const res = await axiosClient.get(`${BASE_URL}/key/${key}`);
      return { success: true, data: res.data };
    } catch (err) {
      console.error("Get setting by key failed:", err);
      return { success: false, message: err.response?.data?.message || "Lấy cài đặt thất bại" };
    }
  },

  updateSettingByKey: async (key, data) => {
    try {
      const res = await axiosClient.put(`${BASE_URL}/key/${key}`, data);
      return { success: true, data: res.data };
    } catch (err) {
      console.error("Update setting failed:", err);
      return { success: false, message: err.response?.data?.message || "Cập nhật cài đặt thất bại" };
    }
  },

  updateSettingById: async (id, data) => {
    try {
      const res = await axiosClient.put(`${BASE_URL}/${id}`, data);
      return { success: true, data: res.data };
    } catch (err) {
      console.error("Update setting failed:", err);
      return { success: false, message: err.response?.data?.message || "Cập nhật cài đặt thất bại" };
    }
  },

  deleteSetting: async (id) => {
    try {
      const res = await axiosClient.delete(`${BASE_URL}/${id}`);
      return { success: true, data: res.data };
    } catch (err) {
      console.error("Delete setting failed:", err);
      return { success: false, message: err.response?.data?.message || "Xóa cài đặt thất bại" };
    }
  },
};
