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

  uploadFile: async (
    file,
    objectId = null,
    objectTypeName = null,
    relationType = null
  ) => {
    try {
      const formData = new FormData();
      formData.append("File", file);

      if (objectId) formData.append("ObjectId", objectId);
      if (objectTypeName) formData.append("ObjectTypeName", objectTypeName);
      if (relationType) formData.append("RelationType", relationType);

      const res = await axiosClient.post("/File/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return { success: true, data: res.data };
    } catch (error) {
      console.error("Upload file error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Upload file thất bại",
      };
    }
  },

  uploadFiles: async (files, objectId = null, objectTypeName = null) => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      if (objectId) formData.append("objectId", objectId);
      if (objectTypeName) formData.append("objectTypeName", objectTypeName);
      const res = await axiosClient.post("/File/upload-many", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (Array.isArray(res.data)) {
        console.log(" Response là array of file paths");
        return { success: true, data: { filePaths: res.data } };
      }
      if (res.data?.filePaths) {
        console.log(" Response có property filePaths");
        return { success: true, data: res.data };
      }
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Upload files error:", error);
      console.error("Error response:", error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || "Upload files thất bại",
      };
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
