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

  // --- Đăng ký kỹ thuật viên ---
  registerTechnician: async ({
    email,
    fullName,
    specializations = [],
    experience, // dạng range: "0-1", "1-3", ...
    bio,
    certifications,
    availability = [],
    // phone,
    // address,
    // city,
    // hourlyRate,
  }) => {
    try {
      // Chuyển range -> số năm (int)
      const expMap = {
        "0-1": 1,
        "1-3": 2,
        "3-5": 4,
        "5-10": 7,
        "10+": 10,
      };
      const experienceYears = expMap[experience] ?? 0;

      // Gom skillsets thành JSON string (giữ gọn để không vượt quá 200 ký tự theo backend)
      let skillObj = {
        specializations,
        // Các field dưới đây không có trong API nhưng gom lại để lưu tóm tắt
        // Lưu ý: backend giới hạn SkillSet tối đa 200 ký tự
        bio: bio?.slice(0, 80),
        certifications: certifications?.slice(0, 80),
        availability: availability.slice(0, 5), // cắt bớt nếu quá dài
        // phone, address, city, hourlyRate có thể dài -> comment lại để tránh vượt quá 200
        // phone,
        // address,
        // city,
        // hourlyRate,
      };

      let skillSet = JSON.stringify(skillObj);
      if (skillSet.length > 200) {
        // Thu gọn thêm nếu vượt
        skillObj = { specializations: specializations.slice(0, 5) };
        skillSet = JSON.stringify(skillObj);
        if (skillSet.length > 200) {
          // Chốt phương án rút gọn tối đa
          skillSet = JSON.stringify({ s: specializations.slice(0, 3) });
        }
      }

      const payload = {
        email,
        fullName,
        skillSet,
        experienceYears,
      };

      const res = await axiosClient.post(
        `/Authentication/register-technician`,
        payload
      );
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Register technician error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          "Đăng ký kỹ thuật viên thất bại",
      };
    }
  },

  // --- Đăng ký kỹ thuật viên ---
  registerTechnician: async ({
    email,
    fullName,
    specializations = [],
    experience, // dạng range: "0-1", "1-3", ...
    bio,
    certifications,
    availability = [],
    phone,
    address,
    city,
    hourlyRate,
  }) => {
    try {
      // Chuyển range -> số năm (int)
      const expMap = {
        "0-1": 1,
        "1-3": 2,
        "3-5": 4,
        "5-10": 7,
        "10+": 10,
      };
      const experienceYears = expMap[experience] ?? 0;

      // Gom skillsets thành JSON string (giữ gọn để không vượt quá 200 ký tự theo backend)
      let skillObj = {
        specializations,
        // Các field dưới đây không có trong API nhưng gom lại để lưu tóm tắt
        // Lưu ý: backend giới hạn SkillSet tối đa 200 ký tự
        bio: bio?.slice(0, 80),
        certifications: certifications?.slice(0, 80),
        availability: availability.slice(0, 5), // cắt bớt nếu quá dài
        // phone, address, city, hourlyRate có thể dài -> comment lại để tránh vượt quá 200
        // phone,
        // address,
        // city,
        // hourlyRate,
      };

      let skillSet = JSON.stringify(skillObj);
      if (skillSet.length > 200) {
        // Thu gọn thêm nếu vượt
        skillObj = { specializations: specializations.slice(0, 5) };
        skillSet = JSON.stringify(skillObj);
        if (skillSet.length > 200) {
          // Chốt phương án rút gọn tối đa
          skillSet = JSON.stringify({ s: specializations.slice(0, 3) });
        }
      }

      const payload = {
        email,
        fullName,
        skillSet,
        experienceYears,
      };

      const res = await axios.post(
        `${API_URL}/Authentication/register-technician`,
        payload
      );
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Register technician error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          "Đăng ký kỹ thuật viên thất bại",
      };
    }
  },

  // --- Đăng nhập ---
  login: async ({ email, password }) => {
    try {
      const res = await axiosClient.post(`/Authentication/login`, {
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
