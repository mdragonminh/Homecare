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

      if (ENABLE_DEBUG)
        console.log("Cập nhật vị trí kỹ thuật viên thành công:", response.data);

      return { success: true, data: response.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Cập nhật vị trí lỗi:", error);
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
};
