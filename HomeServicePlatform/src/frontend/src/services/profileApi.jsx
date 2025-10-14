import axiosClient from "../config/axiosClient";

const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG === "true";

export const profileApi = {
  // Lấy thông tin profile của user hiện tại
  getMyProfile: async () => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const response = await axiosClient.get(`/CustomerProfile/my-profile`, {
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

      const response = await axiosClient.get(`/CustomerProfile/${profileId}`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (ENABLE_DEBUG)
        console.log("Get profile by ID success:", response.data);
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

  // Đổi mật khẩu
  changePassword: async (currentPassword, newPassword, confirmNewPassword) => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const response = await axiosClient.post(
        `/Authentication/change-password`,
        {
          currentPassword,
          newPassword,
          confirmNewPassword,
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

  // Cập nhật thông tin profile
  updateMyProfile: async (fullName, phoneNumber) => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const response = await axiosClient.put(`/CustomerProfile/my-profile`, {
        fullName,
        phoneNumber,
      });

      if (ENABLE_DEBUG) console.log("Update profile success:", response.data);
      return {
        success: true,
        data: response.data,
        message: "Cập nhật thông tin thành công",
      };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Update profile error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi cập nhật thông tin profile",
      };
    }
  },

  // Yêu cầu thay đổi email (gửi verification)
  requestEmailChange: async (newEmail) => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const response = await axiosClient.post(
        `/CustomerProfile/request-email-change`,
        {
          newEmail,
        }
      );

      if (ENABLE_DEBUG)
        console.log("Request email change success:", response.data);
      return { success: true, message: "Email xác thực đã được gửi" };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Request email change error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi yêu cầu thay đổi email",
      };
    }
  },

  // Xác nhận thay đổi email
  confirmEmailChange: async (token) => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const response = await axiosClient.post(
        `/CustomerProfile/confirm-email-change`,
        {
          token,
        }
      );

      if (ENABLE_DEBUG)
        console.log("Confirm email change success:", response.data);
      return {
        success: true,
        data: response.data,
        message: "Email đã được cập nhật thành công",
      };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Confirm email change error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi xác nhận thay đổi email",
      };
    }
  },
};
