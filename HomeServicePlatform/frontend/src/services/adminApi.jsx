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
};
