import axiosClient from "../config/axiosClient";

const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG === "true";
const uploadAvatarHelper = async (avatarFile, objectTypeName) => {
  try {
    const jwtToken = localStorage.getItem("jwtToken");
    const userId = localStorage.getItem("userId");

    if (!jwtToken || !userId) {
      throw new Error(
        "Không tìm thấy token hoặc userId. Vui lòng đăng nhập lại."
      );
    }
    const formData = new FormData();
    formData.append("File", avatarFile);
    formData.append("ObjectTypeName", objectTypeName);
    formData.append("RelationType", "avatar");

    const response = await axiosClient.post(`/File/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    if (ENABLE_DEBUG)
      console.log(
        `Upload avatar for ${objectTypeName} success:`,
        response.data
      );
    return {
      success: true,
      data: response.data,
      message: "Tải lên avatar thành công",
    };
  } catch (error) {
    if (ENABLE_DEBUG)
      console.error(`Upload avatar for ${objectTypeName} error:`, error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        "Lỗi khi tải lên avatar",
    };
  }
};
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

  // Upload avatar
  uploadAvatar: async (avatarFile) =>
    uploadAvatarHelper(avatarFile, "customer"),
  // Delete avatar
  deleteAvatar: async () => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      const userId = localStorage.getItem("userId");

      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      if (!userId) {
        throw new Error("Không tìm thấy userId. Vui lòng đăng nhập lại.");
      }

      // Lấy danh sách files của user với ObjectTypeName="customer"
      // Endpoint: GET /File/{objectTypeName}/{objectId}
      const filesResponse = await axiosClient.get(`/File/customer/${userId}`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (ENABLE_DEBUG)
        console.log("Get files for delete avatar:", filesResponse.data);

      // Lấy danh sách files (có thể có nhiều loại, chỉ lấy avatar)
      const allFiles = Array.isArray(filesResponse.data)
        ? filesResponse.data
        : [];

      // Lọc các file có RelationType = "avatar" (nếu backend trả về RelationType)
      // Hoặc xóa tất cả files của user (vì thường chỉ có 1 avatar)
      // Note: Backend có thể không trả về RelationType trong FileDto,
      // nên ta sẽ xóa tất cả files của user (thường chỉ có 1 avatar)
      const avatarFiles = allFiles;

      if (avatarFiles.length === 0) {
        return {
          success: false,
          message: "Không tìm thấy avatar để xóa",
        };
      }

      // Xóa tất cả avatar files
      const deletePromises = avatarFiles.map((file) =>
        axiosClient.delete(`/File/${file.id}`, {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        })
      );

      await Promise.all(deletePromises);

      if (ENABLE_DEBUG) console.log("Delete avatar success");
      return {
        success: true,
        message: "Xóa avatar thành công",
      };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Delete avatar error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi xóa avatar",
      };
    }
  },
};
export const technicianApi = {
  getTechnicianDetails: async (technicianId) => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const response = await axiosClient.get(
        `/TechnicianManagement/technicians/${technicianId}`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (ENABLE_DEBUG)
        console.log("Get technician details success:", response.data);
      return { success: true, data: response.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Get technician details error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi lấy thông tin Technician",
      };
    }
  },
  uploadAvatar: async (avatarFile) =>
    uploadAvatarHelper(avatarFile, "technician"),

  updateTechnicianProfile: async ({
    citizenId,
    address,
    experienceYears,
    services = [],          
    legalDocumentFile,       
    certificateFiles = [],   
  }) => {
    try {
     
      const jwtToken = localStorage.getItem("jwtToken"); 

      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }
      
      
      const formData = new FormData();
      
     
      if (!legalDocumentFile) {
          throw new Error("Vui lòng tải lên Tài liệu pháp lý.");
      }
      formData.append("LegalDocument", legalDocumentFile);
      
      // Thêm file Optional: Certificates
      certificateFiles.forEach((file) => {
          formData.append("Certificates", file);
      });

      
      if (services.length > 0) {
          services.forEach((serviceId) => {
             
              formData.append("Services", serviceId); 
          });
      }
      
     
      const queryParams = new URLSearchParams({
          CitizenId: citizenId,
          Address: address,
          ExperienceYears: experienceYears.toString(), 
      }).toString();
      
      const url = `/TechnicianManagement?${queryParams}`; // Endpoint PUT với Query String
      const response = await axiosClient.put(url, formData);

      if (ENABLE_DEBUG)
        console.log("Update technician profile success:", response.data);
        
      return { 
        success: true, 
        data: response.data,
        message: "Cập nhật thông tin kỹ thuật viên thành công", 
      };
    } catch (error) {
      if (ENABLE_DEBUG)
        console.error("Update technician profile error:", error);
        
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi cập nhật thông tin kỹ thuật viên",
      };
    }
  },
};
