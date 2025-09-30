// authApi.jsx

import axiosClient from "../utils/axiosClient";

export const authApi = {
  // --- Đăng ký ---
  register: async ({ email, fullName, password }) => {
    try {
      const res = await axiosClient.post("/Authentication/register", {
        email,
        fullName,
        password,
        confirmPassword: password,
      });
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Register error:", error);

      const responseData = error.response?.data;

      if (responseData && typeof responseData === "object" && !Array.isArray(responseData)) {
        return { success: false, validationErrors: responseData };
      }

      const message = responseData?.message || "Đăng ký thất bại";
      return { success: false, message };
    }
  },

  // --- Đăng nhập ---
  login: async ({ email, password }) => {
    try {
      const res = await axiosClient.post("/Authentication/login", { email, password });

      if (res.status === 200 && res.data?.jwtToken) {
        const mappedData = {
          userId: res.data.userId,
          email: res.data.email,
          jwtToken: res.data.jwtToken,
        };
        return { success: true, data: mappedData };
      }

      return { success: false, message: "Đăng nhập thất bại. Sai định dạng phản hồi từ server." };
    } catch (error) {
      console.error("Login error:", error);

      const responseData = error.response?.data;

      if (responseData && typeof responseData === "object" && !Array.isArray(responseData)) {
        return { success: false, validationErrors: responseData };
      }

      const message =
        responseData?.message ||
        (error.response?.status === 401 ? "Email hoặc mật khẩu không đúng." : "Đăng nhập thất bại.");
      return { success: false, message };
    }
  },

  // --- Xác thực email ---
  confirmEmail: async (token) => {
    try {
      const res = await axiosClient.post("/Authentication/confirm-email", { token });
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Confirm email error:", error);

      const responseData = error.response?.data;

      if (responseData && typeof responseData === "object" && !Array.isArray(responseData)) {
        return { success: false, validationErrors: responseData };
      }

      const message = responseData?.message || "Xác thực email thất bại";
      return { success: false, message };
    }
  },

  // --- Google Login ---
  googleLogin: () => {
    const API_URL = axiosClient.defaults.baseURL; // ✅ lấy từ config axiosClient
    window.location.href = `${API_URL}/Authentication/google-login`;
  },

  // --- Parse Google token từ URL ---
  parseGoogleTokenFromUrl: (searchParams) => {
    try {
      const token = new URLSearchParams(searchParams).get("token");
      if (!token) return { success: false, message: "No token found in URL" };
      return { success: true, data: { jwtToken: token } };
    } catch (error) {
      console.error("Parse token error:", error);
      return { success: false, message: "Failed to parse token from URL" };
    }
  },

  // --- Logout ---
  logout: () => {
    ["jwtToken", "userId", "email", "name", "role"].forEach((key) => localStorage.removeItem(key));
  },
};
