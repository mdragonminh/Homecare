import axiosClient from "../config/axiosClient";

const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG === "true";

export const technicianApi = {
  updateLocation: async (latitude, longitude) => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const response = await axiosClient.put(
        `/TechnicianLocation/update-location`,
        { latitude, longitude },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      // if (ENABLE_DEBUG)
      //   console.log("Cập nhật vị trí kỹ thuật viên thành công:", response.data);

      return { success: true, data: response.data };
    } catch (error) {
      //if (ENABLE_DEBUG) console.error("Cập nhật vị trí lỗi:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi cập nhật vị trí kỹ thuật viên",
      };
    }
  },

  // API cho quản lý kỹ thuật viên (Admin/Operator)
  getTechnicians: async (filterParams = {}) => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const params = new URLSearchParams();
      Object.keys(filterParams).forEach((key) => {
        if (
          filterParams[key] !== undefined &&
          filterParams[key] !== null &&
          filterParams[key] !== ""
        ) {
          params.append(key, filterParams[key]);
        }
      });

      const response = await axiosClient.get(
        `/TechnicianManagement/technicians?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (ENABLE_DEBUG)
        console.log("Lấy danh sách kỹ thuật viên thành công:", response.data);

      return { success: true, data: response.data };
    } catch (error) {
      if (ENABLE_DEBUG)
        console.error("Lấy danh sách kỹ thuật viên lỗi:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi lấy danh sách kỹ thuật viên",
      };
    }
  },

  getTechnicianById: async (id) => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const response = await axiosClient.get(
        `/TechnicianManagement/technicians/${id}`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (ENABLE_DEBUG)
        console.log("Lấy chi tiết kỹ thuật viên thành công:", response.data);

      return { success: true, data: response.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Lấy chi tiết kỹ thuật viên lỗi:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi lấy chi tiết kỹ thuật viên",
      };
    }
  },

  approveTechnician: async (id) => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const response = await axiosClient.post(
        `/TechnicianManagement/technicians/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (ENABLE_DEBUG)
        console.log("Duyệt kỹ thuật viên thành công:", response.data);

      return { success: true, data: response.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Duyệt kỹ thuật viên lỗi:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi duyệt kỹ thuật viên",
      };
    }
  },

  rejectTechnician: async (id, body) => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const response = await axiosClient.post(
        `/TechnicianManagement/technicians/${id}/reject`,
        body,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (ENABLE_DEBUG)
        console.log("Từ chối kỹ thuật viên thành công:", response.data);

      return { success: true, data: response.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Từ chối kỹ thuật viên lỗi:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi từ chối kỹ thuật viên",
      };
    }
  },

  batchApproveTechnicians: async (technicianIds) => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const response = await axiosClient.post(
        `/TechnicianManagement/technicians/batch-approve`,
        technicianIds,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (ENABLE_DEBUG)
        console.log("Duyệt hàng loạt kỹ thuật viên thành công:", response.data);

      return { success: true, data: response.data };
    } catch (error) {
      if (ENABLE_DEBUG)
        console.error("Duyệt hàng loạt kỹ thuật viên lỗi:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi duyệt hàng loạt kỹ thuật viên",
      };
    }
  },

  batchRejectTechnicians: async (technicianIds) => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const response = await axiosClient.post(
        `/TechnicianManagement/technicians/batch-reject`,
        technicianIds,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (ENABLE_DEBUG)
        console.log(
          "Từ chối hàng loạt kỹ thuật viên thành công:",
          response.data
        );

      return { success: true, data: response.data };
    } catch (error) {
      if (ENABLE_DEBUG)
        console.error("Từ chối hàng loạt kỹ thuật viên lỗi:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi từ chối hàng loạt kỹ thuật viên",
      };
    }
  },

  getTechnicianListForSupport: async () => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const response = await axiosClient.get(
        `/Technician`, 
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (ENABLE_DEBUG)
        console.log("Lấy danh sách KTV cho Supporter thành công:", response.data);

      return { success: true, data: response.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Lấy danh sách KTV cho Supporter lỗi:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Lỗi khi lấy danh sách kỹ thuật viên",
      };
    }
  },
};

