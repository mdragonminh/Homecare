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
        message:
          error.response?.data?.message ||
          error.response?.data ||
          "Đăng ký thất bại",
      };
    }
  },

  // --- Đăng nhập ---
  // --- Đăng nhập ---
login: async ({ email, password }) => {
  try {
    const res = await axios.post(`${API_URL}/Authentication/login`, {
      email,
      password,
    });

    if (res.status === 200 && res.data?.jwtToken) {
      const mappedData = {
        userId: res.data.userId,
        email: res.data.email,
        jwtToken: res.data.jwtToken,
      };
      return { success: true, data: mappedData };
    } else {
      return { success: false, message: "Đăng nhập thất bại. Sai định dạng phản hồi từ server." };
    }
  } catch (error) {
    console.error("🔥 Login error:", error);

    // Lấy thông báo lỗi từ backend
    const backendMessage = error.response?.data?.message;

    return {
      success: false,
      message:
        backendMessage ||
        (error.response?.status === 401
          ? "Email hoặc mật khẩu không đúng."
          : "Đăng nhập thất bại. Vui lòng thử lại."),
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
        message:
          error.response?.data?.message ||
          error.response?.data ||
          "Xác thực email thất bại",
      };
    }
  },

  // --- Google Login: chuyển hướng người dùng đến Google ---
  googleLogin: () => {
    window.location.href = `${API_URL}/Authentication/google-login`;
  },

  // --- Parse Google token từ URL (optional helper function) ---
  parseGoogleTokenFromUrl: (searchParams) => {
    try {
      const token = new URLSearchParams(searchParams).get('token');
      if (!token) {
        return { success: false, message: "No token found in URL" };
      }
      
      return { 
        success: true, 
        data: { 
          jwtToken: token 
        } 
      };
    } catch (error) {
      console.error("Parse token error:", error);
      return {
        success: false,
        message: "Failed to parse token from URL"
      };
    }
  },

  // --- Logout ---
  logout: () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    localStorage.removeItem("name");
    localStorage.removeItem("role");
  }
};