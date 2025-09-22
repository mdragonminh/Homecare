import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const authApi = {
  // --- Đăng ký ---
  register: async ({ email, fullName, password }) => {
    try {
      const res = await axios.post(`${API_URL}/Authentication/register`, {
        email,
        fullName,
        password,
        confirmPassword: password,
      });
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Register error:", error);
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data || "Đăng ký thất bại",
      };
    }
  },

  // --- Đăng nhập ---
  login: async ({ email, password }) => {
    try {
      console.log("🔍 API URL:", `${API_URL}/Authentication/login`);
      console.log("📤 Request payload:", { email, password });
      
      const res = await axios.post(`${API_URL}/Authentication/login`, {
        email,
        password,
      });

      console.log("📥 Full response:", res);
      console.log("📥 Response data:", res.data);
      console.log("📥 Response status:", res.status);

      // Check if response is successful
      if (res.status === 200 && res.data) {
        return { success: true, data: res.data };
      } else {
        return { success: false, message: "Unexpected response format" };
      }
      
    } catch (error) {
      console.error("🔥 Login error:", error);
      console.error("🔥 Error response:", error.response);
      console.error("🔥 Error response data:", error.response?.data);
      
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data || error.message || "Đăng nhập thất bại",
      };
    }
  },

  // --- Xác thực email ---
  confirmEmail: async (token) => {
    try {
      const res = await axios.post(`${API_URL}/Authentication/confirm-email`, {
        token,
      });
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Confirm email error:", error);
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data || "Xác thực email thất bại",
      };
    }
  },
};