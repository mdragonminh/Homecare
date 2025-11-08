import axiosClient from "../config/axiosClient";

const BASE_URL = "/HomeService";

export const homeApi = {
  listHomeService: async (params) => {
    try {
      const res = await axiosClient.get(`${BASE_URL}/services`, { params });
      return res.data;
    } catch (err) {
      console.error("List failed:", err);
      throw err;
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

  createHomeService: async (data) => {
    try {
      const res = await axiosClient.post(`${BASE_URL}`, data);
      return res.data;
    } catch (err) {
      console.error("Create failed:", err);
      throw err;
    }
  },

  updateHomeService: async (id, data) => {
    try {
      const res = await axiosClient.put(`${BASE_URL}/${id}`, data);
      return res.data;
    } catch (err) {
      console.error("Update failed:", err);
      throw err;
    }
  },

  deleteHomeService: async (id) => {
    try {
      const res = await axiosClient.delete(`${BASE_URL}/${id}`);
      return res.data;
    } catch (err) {
      console.error("Delete failed:", err);
      throw err;
    }
  },
};
