// src/services/authApi.jsx
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const API_URL = "http://localhost:9999"; // json-server

export const authApi = {
  // Đăng nhập
  login: async ({ email, password }) => {
    try {
      const res = await axios.get(`${API_URL}/users`, {
        params: { email, password },
      });

      if (res.data.length > 0) {
        const user = res.data[0];

        // Tạo token mới mỗi lần login
        const newToken = `jwt-token-${uuidv4()}`;
        await axios.patch(`${API_URL}/users/${user.id}`, { token: newToken });

        return { success: true, user: { ...user, token: newToken }, token: newToken };
      } else {
        return { success: false, message: "Sai email hoặc mật khẩu" };
      }
    } catch (error) {
      console.error("Lỗi khi đăng nhập:", error);
      return { success: false, message: "Có lỗi xảy ra khi đăng nhập" };
    }
  },

  // Đăng ký
  register: async (userData) => {
    try {
      // Check email đã tồn tại chưa
      const existingUsers = await axios.get(`${API_URL}/users`, {
        params: { email: userData.email },
      });

      if (existingUsers.data.length > 0) {
        return { success: false, message: "Email đã tồn tại" };
      }

      const newUser = {
        ...userData,
        id: uuidv4(),
        token: `jwt-token-${uuidv4()}`,
      };

      const res = await axios.post(`${API_URL}/users`, newUser);

      return { success: true, user: res.data, token: res.data.token };
    } catch (error) {
      console.error("Lỗi khi đăng ký:", error);
      return { success: false, message: "Có lỗi xảy ra khi đăng ký" };
    }
  },

  // Lấy user từ token
  getUserByToken: async (token) => {
    try {
      const res = await axios.get(`${API_URL}/users`, {
        params: { token },
      });
      return res.data.length > 0 ? res.data[0] : null;
    } catch (error) {
      console.error("Lỗi khi lấy user bằng token:", error);
      return null;
    }
  },
};
