import axiosClient from "../config/axiosClient";

export const authApi = {
  register: async ({ email, fullName, phoneNumber, password }) => {
    try {
      const res = await axiosClient.post("/Authentication/register", {
        email,
        fullName,
        phoneNumber,
        password,
        confirmPassword: password,
      });
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Register error:", error);

      if (!error.response) {
        throw error;
      }
      const responseData = error.response?.data;
      const serverMessage =
        responseData?.message || error.message || "Đăng ký thất bại.";
      return {
        success: false,
        message: serverMessage,
        status: error.response.status,
        data: responseData,
      };
    }
  },
  addPassword: async ({ newPassword, confirmPassword }) => {
    try {
      const res = await axiosClient.post("/Authentication/add-password", {
        newPassword,
        confirmPassword,
      });
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Add password error:", error);

      const responseData = error.response?.data;

      if (
        responseData &&
        typeof responseData === "object" &&
        !Array.isArray(responseData)
      ) {
        return { success: false, validationErrors: responseData };
      }

      const message = responseData?.message || "Thêm mật khẩu thất bại";
      return { success: false, message };
    }
  },
  uploadCertificates: async (certificateFiles) => {
    try {
      const formData = new FormData();
      certificateFiles.forEach((file) => {
        formData.append("certificates", file);
      });

      const res = await axiosClient.post(
        "/Authentication/upload-certificates",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return { success: true, data: res.data };
    } catch (error) {
      console.error("Upload certificates error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Upload chứng chỉ thất bại",
      };
    }
  },

  registerTechnician: async ({
    email,
    fullName,
    phone,
    specializations = [],
    experience,
    bio,
    certifications,
    availability = [],
    certificateFilePaths = [],
  }) => {
    try {
      const expMap = {
        "0-1": 1,
        "1-3": 2,
        "3-5": 4,
        "5-10": 7,
        "10+": 10,
      };
      const experienceYears = expMap[experience] ?? 0;

      let skillObj = {
        specializations,
        bio: bio?.slice(0, 80),
        certifications: certifications?.slice(0, 80),
        availability: availability.slice(0, 5),
      };

      let skillSet = JSON.stringify(skillObj);
      if (skillSet.length > 200) {
        skillObj = { specializations: specializations.slice(0, 5) };
        skillSet = JSON.stringify(skillObj);
        if (skillSet.length > 200) {
          skillSet = JSON.stringify({ s: specializations.slice(0, 3) });
        }
      }

      const payload = {
        email,
        fullName,
        phoneNumber: phone,
        skillSet,
        experienceYears,
        certificateFilePaths,
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

  login: async ({ emailOrPhone, password }) => {
    try {
      const res = await axiosClient.post(`/Authentication/login`, {
        emailOrPhone,
        password,
      });

      if (res.status === 200 && res.data?.jwtToken) {
        return {
          success: true,
          data: {
            userId: res.data.userId,
            emailOrPhone: res.data.emailOrPhone,
            jwtToken: res.data.jwtToken,
            requirePasswordSetup: res.data.requirePasswordSetup || false,
          },
        };
      }

      return {
        success: false,
        message: "Đăng nhập thất bại. Sai định dạng phản hồi từ server.",
      };
    } catch (error) {
      console.error("Login error:", error);

      const responseData = error.response?.data;
      if (
        responseData &&
        typeof responseData === "object" &&
        !Array.isArray(responseData)
      ) {
        return { success: false, validationErrors: responseData };
      }

      const message =
        responseData?.message ||
        (error.response?.status === 401
          ? "Email hoặc mật khẩu không đúng."
          : "Đăng nhập thất bại.");
      return { success: false, message };
    }
  },
  requestPasswordReset: async ({ email }) => {
    try {
      const res = await axiosClient.post("/Authentication/forget-password", {
        email,
      });
      return {
        success: true,
        data: res.data,
        message:
          "Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.",
      };
    } catch (error) {
      console.error("Request password reset error:", error);

      const responseData = error.response?.data;
      let message = "Yêu cầu đặt lại mật khẩu thất bại.";

      if (responseData && responseData.message) {
        message = responseData.message;

        const lowerCaseMessage = message.toLowerCase();
        if (
          lowerCaseMessage.includes("user not found") ||
          lowerCaseMessage.includes("không tìm thấy người dùng")
        ) {
          message = "Địa chỉ email này không tồn tại trong hệ thống.";
        }
      } else if (error.response?.status === 400) {
        message =
          "Thông tin yêu cầu không hợp lệ. Vui lòng kiểm tra lại email.";
      }

      return { success: false, message };
    }
  },
  resetPassword: async ({ userId, token, newPassword, confirmPassword }) => {
    try {
      const res = await axiosClient.post("/Authentication/reset-password", {
        userId,
        token,
        newPassword,
        confirmPassword,
      });
      return {
        success: true,
        data: res.data,
        message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay.",
      };
    } catch (error) {
      console.error("Reset password error:", error);

      const responseData = error.response?.data;
      let message = "Đặt lại mật khẩu thất bại.";

      if (responseData && responseData.message) {
        message = responseData.message;

        const lowerCaseMessage = message.toLowerCase();
        if (
          lowerCaseMessage.includes("passwords do not match") ||
          lowerCaseMessage.includes("mật khẩu không khớp")
        ) {
          message = "Mật khẩu mới và xác nhận mật khẩu không khớp.";
        } else if (
          lowerCaseMessage.includes("password reset failed") ||
          lowerCaseMessage.includes("đặt lại mật khẩu thất bại")
        ) {
          message =
            "Mã token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.";
        } else if (lowerCaseMessage.includes("user not found")) {
          message = "Thông tin người dùng không hợp lệ.";
        }
      } else if (error.response?.status === 400) {
        message =
          "Yêu cầu không hợp lệ. Kiểm tra token và định dạng mật khẩu mới.";
      }

      return { success: false, message };
    }
  },
  // --- Xác thực email ---
  confirmEmail: async ({ userId, token }) => {
    try {
      const res = await axiosClient.get("/Authentication/confirm-email", {
        params: { userId, token },
      });
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Confirm email error:", error);

      const responseData = error.response?.data;

      if (
        responseData &&
        typeof responseData === "object" &&
        !Array.isArray(responseData)
      ) {
        return { success: false, validationErrors: responseData };
      }

      const message = responseData?.message || "Xác thực email thất bại";
      return { success: false, message };
    }
  },

  googleLogin: () => {
    const API_URL = axiosClient.defaults.baseURL;
    window.location.href = `${API_URL}/Authentication/google-login`;
  },

  parseGoogleTokenFromUrl: (searchParams) => {
    try {
      const urlParams = new URLSearchParams(searchParams);
      const token = urlParams.get("token");

      const requirePasswordSetupParam = urlParams
        .get("requirePasswordSetup")
        ?.toLowerCase();
      const requirePasswordSetup = requirePasswordSetupParam === "true";

      if (!token) return { success: false, message: "No token found in URL" };

      localStorage.setItem(
        "requirePasswordSetup",
        requirePasswordSetup.toString()
      );

      return {
        success: true,
        data: {
          jwtToken: token,
          requirePasswordSetup: requirePasswordSetup,
        },
      };
    } catch (error) {
      console.error("Parse token error:", error);
      return { success: false, message: "Failed to parse token from URL" };
    }
  },

  logout: () => {
    [
      "jwtToken",
      "userId",
      "email",
      "name",
      "role",
      "requirePasswordSetup",
    ].forEach((key) => localStorage.removeItem(key));
  },
};
