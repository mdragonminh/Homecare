// File: statisticsApi.jsx

import axiosClient from "../config/axiosClient";

const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG === "true";

export const statisticsApi = {
  getPublicStatistics: async () => {
    try {
      const url = "/Statistics/public";
      console.log("Statistics API: Calling endpoint:", url);
      const res = await axiosClient.get(url);
      console.log("Statistics API: Response received:", res.data);
      if (ENABLE_DEBUG)
        console.log("Statistics API: Fetch successful, returning data.");
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Statistics API: Error fetching statistics.", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Lỗi khi lấy thống kê",
        data: null,
      };
    }
  },
};

