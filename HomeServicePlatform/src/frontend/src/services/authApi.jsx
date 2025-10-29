import axiosClient from "../config/axiosClient";
import { jwtDecode } from "jwt-decode";
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

  registerTechnician: async (formData) => {
    try {
      console.log("Sending registerTechnician (FormData) payload");

      const res = await axiosClient.post(
        "/Authentication/register-technician",
        formData
      );

      let technicianId;
      if (typeof res.data === "string") {
        technicianId = res.data;
      } else if (typeof res.data === "object" && res.data !== null) {
        technicianId = res.data.id || res.data.technicianId;
      }

      return {
        success: true,
        data: {
          technicianId: technicianId,
          id: technicianId,
        },
      };
    } catch (error) {
      console.error("Register technician error:", error);
      console.log(
        "Response data:",
        JSON.stringify(error.response?.data, null, 2)
      );

      return {
        success: false,
        message:
          error.response?.data?.message ||
          (typeof error.response?.data === "object"
            ? JSON.stringify(error.response?.data)
            : error.response?.data) ||
          "Đăng ký kỹ thuật viên thất bại",
        status: error.response?.status,
        errors: error.response?.data?.errors || null,
      };
    }
  },
  prepareRegisterTechnicianData: ({
    email,
    fullName,
    phoneNumber,
    serviceIds,
    experience,
    address = "",
    password,
    confirmPassword,
    avatarFile,
    serviceCertificates,
  }) => {
    const expMap = {
      "0-1": 1,
      "1-3": 2,
      "3-5": 4,
      "5-10": 7,
      "10+": 10,
    };
    const experienceYears = expMap[experience] ?? 0;

    const formData = new FormData();
    formData.append("Email", email);
    formData.append("FullName", fullName);
    formData.append("PhoneNumber", phoneNumber);
    formData.append("ExperienceYears", experienceYears.toString());
    formData.append("Address", address);
    formData.append("Password", password);
    formData.append("ConfirmPassword", confirmPassword);
    if (serviceIds && serviceIds.length > 0) {
      serviceIds.forEach((id) => {
        formData.append("ServiceIds", id.toString());
      });
    }
    if (avatarFile) {
      formData.append("AvatarFile", avatarFile, avatarFile.name);
    }
    if (serviceCertificates) {
      serviceIds.forEach((serviceId) => {
        const certs = serviceCertificates[serviceId] || [];
        certs.forEach((cert) => {
          if (cert.file) {
            formData.append("CertificateFiles", cert.file, cert.name);
          }
        });
      });
    }

    console.log("=== FormData Debug ===");
    console.log("Total serviceIds:", serviceIds.length);
    console.log("Has avatar:", !!avatarFile);
    console.log(
      "Certificate count:",
      Object.values(serviceCertificates).reduce(
        (sum, certs) => sum + certs.length,
        0
      )
    );

    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}:`, `[File] ${value.name} (${value.size} bytes)`);
      } else {
        console.log(`${key}:`, value);
      }
    }
    console.log("=== End FormData ===");

    return formData;
  },
  login: async ({ emailOrPhone, password }) => {
    try {
      const res = await axiosClient.post(`/Authentication/login`, {
        emailOrPhone,
        password,
      });

      // === THÀNH CÔNG ===
      const tokenData = res.data?.jwtToken;
      if (
        res.status === 200 &&
        tokenData?.accessToken &&
        tokenData?.refreshToken
      ) {
        const accessToken = tokenData.accessToken;
        const decodedToken = jwtDecode(accessToken);
        const userId = decodedToken.sub || decodedToken.UserId;
        const email = decodedToken.email || decodedToken.Email;
        const name =
          decodedToken.UniqueName || decodedToken.name || decodedToken.Fullname;
        const role = decodedToken.role || decodedToken.Role;

        localStorage.setItem("jwtToken", accessToken);
        localStorage.setItem("refreshToken", tokenData.refreshToken);
        localStorage.setItem("userId", userId || "");
        localStorage.setItem("email", email || "");
        localStorage.setItem("name", name || "");
        localStorage.setItem("role", role || "");

        return {
          success: true,
          data: {
            userId,
            email,
            name,
            role,
            jwtToken: accessToken,
            refreshToken: tokenData.refreshToken,
            requirePasswordSetup: res.data.requirePasswordSetup || false,
            mustChangePasswordOnLogin:
              res.data.mustChangePasswordOnLogin || false,
          },
        };
      }

      return { success: false, message: "Phản hồi không hợp lệ từ server." };
    } catch (error) {
      console.error("Login error:", error);

      const status = error.response?.status;
      const message = error.response?.data?.message || "";
      if (status === 400 && message === "InvalidEmail") {
        return { success: false, errorType: "INVALID_EMAIL_FORMAT" };
      }
      if (status === 401 && message === "Mật khẩu không hợp lệ") {
        return { success: false, errorType: "INVALID_PASSWORD" };
      }
      if (status === 401 && message === "Email chưa được xác thực") {
        return { success: false, errorType: "EMAIL_NOT_CONFIRMED" };
      }
      return { success: false, errorType: "INVALID_CREDENTIALS" };
    }
  },
  refreshToken: async (refreshToken) => {
    try {
      const res = await axiosClient.post("/Authentication/refresh-token", {
        refreshToken: refreshToken,
      });
      if (res.status === 200 && res.data?.jwtToken && res.data?.refreshToken) {
        localStorage.setItem("jwtToken", res.data.jwtToken);
        localStorage.setItem("refreshToken", res.data.refreshToken);
        return {
          success: true,
          data: res.data,
        };
      }
      return {
        success: false,
        message: "Làm mới token thất bại: Sai định dạng phản hồi.",
      };
    } catch (error) {
      console.error("Refresh token error:", error);
      return {
        success: false,
        message: "Làm mới token thất bại. Vui lòng đăng nhập lại.",
        status: error.response?.status,
      };
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
  exchangeToken: (code) => {
    return axiosClient.get(`/Authentication/exchange-token?code=${code}`);
  },
  parseGoogleTokenFromUrl: async (urlSearch) => {
    try {
      const params = new URLSearchParams(urlSearch);
      const code = params.get("code");
      if (!code) {
        console.error("Missing code param in URL.");
        return { success: false, message: "Thiếu mã xác thực Google." };
      }

      const response = await axiosClient.get(`/Authentication/exchange-token?code=${code}`);
      const loginData = response.data;
      const tokenData = loginData.jwtToken;
      console.log("login data received:", loginData);
      console.log("Token data received:", tokenData);
      if (!tokenData || !tokenData.accessToken) {
        return { success: false, message: "Không nhận được access token." };
      }

      const requirePasswordSetup = loginData.requirePasswordSetup || false;

      const decoded = jwtDecode(tokenData.accessToken);

      const userId =
        decoded.sub ||
        decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
      const email =
        decoded.email ||
        decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
      const name =
        decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
        decoded.UniqueName ||
        decoded.name ||
        decoded.given_name ||
        "";
      const role =
        decoded.role ||
        decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
        "";

      localStorage.setItem("jwtToken", tokenData.accessToken);
      localStorage.setItem("refreshToken", tokenData.refreshToken);
      localStorage.setItem("userId", userId || "");
      localStorage.setItem("email", email || "");
      localStorage.setItem("name", name);
      localStorage.setItem("role", role);
      localStorage.setItem("requirePasswordSetup", requirePasswordSetup.toString());

      return {
        success: true,
        data: {
          jwtToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          accessTokenExpiresAt: tokenData.accessTokenExpiresAt,
          refreshTokenExpiresAt: tokenData.refreshTokenExpiresAt,
          userId,
          email,
          name,
          role,
          requirePasswordSetup
        },
      };
    } catch (error) {
      console.error("Exchange or decode error:", error);
      return { success: false, message: "Lỗi xử lý đăng nhập Google." };
    }
  },
  logout: async () => {
    try {
      await axiosClient.post("/Authentication/logout");
    } catch (error) {
      console.warn(
        "Logout API failed (token might be expired or invalid), proceeding with client-side cleanup:",
        error.response?.status
      );
    }
    [
      "jwtToken",
      "refreshToken",
      "userId",
      "email",
      "name",
      "role",
      "requirePasswordSetup",
    ].forEach((key) => localStorage.removeItem(key));
  },
};
