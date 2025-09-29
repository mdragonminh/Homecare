import axios from "axios";

// Lấy biến môi trường từ .env
const API_URL = import.meta.env.VITE_API_URL;
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG === "true";

export const profileApi = {
  // Lấy thông tin profile của user hiện tại
  getMyProfile: async () => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const response = await axios.get(`${API_URL}/CustomerProfile/my-profile`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (ENABLE_DEBUG) console.log("Get my profile success:", response.data);
      return { success: true, data: response.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Get my profile error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi lấy thông tin profile",
      };
    }
  },

  // Lấy thông tin profile theo ID (cho admin hoặc xem profile public)
  getProfileById: async (profileId) => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const response = await axios.get(
        `${API_URL}/CustomerProfile/${profileId}`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (ENABLE_DEBUG) console.log("Get profile by ID success:", response.data);
      return { success: true, data: response.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Get profile by ID error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi lấy thông tin profile",
      };
    }
  },

  // Debug - Xem thông tin token
  getTokenInfo: async () => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const response = await axios.get(
        `${API_URL}/CustomerProfile/debug/token-info`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (ENABLE_DEBUG) console.log("Get token info success:", response.data);
      return { success: true, data: response.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Get token info error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi lấy thông tin token",
      };
    }
  },

  // Đổi mật khẩu
  changePassword: async (currentPassword, newPassword) => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const response = await axios.post(
        `${API_URL}/Authentication/change-password`,
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (ENABLE_DEBUG) console.log("Change password success:", response.data);
      return { success: true, message: "Đổi mật khẩu thành công" };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Change password error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi đổi mật khẩu",
      };
    }
  },
};
