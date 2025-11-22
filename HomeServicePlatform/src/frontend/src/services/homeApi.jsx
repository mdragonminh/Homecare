import axios from "axios";
import axiosClient from "../config/axiosClient";
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG === "true";

export const homeApi = {
  geocodeAddress: async (address) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${GOOGLE_MAPS_API_KEY}`
      );

      if (response.data.results.length > 0) {
        const { lat, lng } = response.data.results[0].geometry.location;
        return { success: true, latitude: lat, longitude: lng };
      } else {
        throw new Error("Không tìm thấy tọa độ cho địa chỉ này");
      }
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Geocode error:", error);
      return {
        success: false,
        message: error.response?.data?.error_message || "Lỗi khi lấy tọa độ",
      };
    }
  },

  createHome: async ({
    name,
    address,
    latitude,
    longitude,
    customerProfileId,
  }) => {
    try {
      let lat = latitude;
      let lng = longitude;

      if (!lat || !lng) {
        const geocodeResult = await homeApi.geocodeAddress(address);
        if (!geocodeResult.success) throw new Error(geocodeResult.message);
        lat = geocodeResult.latitude;
        lng = geocodeResult.longitude;
      }

      const res = await axiosClient.post("/Home/create-home", {
        name,
        address,
        latitude: lat,
        longitude: lng,
        customerProfileId,
      });

      if (ENABLE_DEBUG) console.log("Create home success:", res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Create home error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Tạo home thất bại",
      };
    }
  },

  getHomesOfCurrentUser: async (
    page = 1,
    pageSize = 10,
    searchTerm = "",
    type = "all"
  ) => {
    try {
      const queryParams = new URLSearchParams({
        pageNumber: page,
        pageSize: pageSize,
        ...(searchTerm && { Search: searchTerm }),
        ...(type !== "all" && { type }),
      }).toString();

      const url = `/Home/list-home?${queryParams}`;

      const res = await axiosClient.get(url);

      if (ENABLE_DEBUG) console.log("Get homes success:", res.data);

      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Get homes error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Lỗi khi lấy danh sách địa chỉ",
      };
    }
  },

  getHomeById: async (homeId) => {
    try {
      const url = `/Home/${homeId}`;

      const res = await axiosClient.get(url);

      if (ENABLE_DEBUG) console.log(`Get home ${homeId} success:`, res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error(`Get home ${homeId} error:`, error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Lỗi khi lấy chi tiết địa chỉ",
      };
    }
  },

  updateHome: async (homeId, { name, address, latitude, longitude }) => {
    try {
      const res = await axiosClient.put(`/Home/${homeId}`, {
        name,
        address,
        latitude,
        longitude,
      });

      if (ENABLE_DEBUG) console.log(`Update home ${homeId} success:`, res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error(`Update home ${homeId} error:`, error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Cập nhật home thất bại",
      };
    }
  },
  deleteHome: async (homeId) => {
    try {
      const res = await axiosClient.delete(`/Home/${homeId}`); // Dùng relative path

      if (ENABLE_DEBUG) console.log(`Delete home ${homeId} success:`, res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error(`Delete home ${homeId} error:`, error);
      return {
        success: false,
        message: error.response?.data?.message || "Xóa home thất bại",
      };
    }
  },
  addHomeItem: async ({
    name,
    brand,
    type,
    modelNumber,
    serialNumber,
    notes,
    homeId,
  }) => {
    try {
      const res = await axiosClient.post("/HomeItem/add-home-item", {
        name,
        brand,
        type,
        modelNumber,
        serialNumber,
        notes,
        homeId,
      });

      if (ENABLE_DEBUG) console.log("Add home item success:", res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Add home item error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Thêm vật phẩm thất bại",
      };
    }
  },

  listHomeItems: async (homeId, page = 1, pageSize = 10, searchTerm = "") => {
    try {
      const queryParams = new URLSearchParams({
        homeId: homeId,
        pageNumber: page,
        pageSize: pageSize,
        ...(searchTerm && { Search: searchTerm }),
      }).toString();

      const url = `/HomeItem/list-home-item?${queryParams}`;

      const res = await axiosClient.get(url);

      if (ENABLE_DEBUG) console.log("List home items success:", res.data);

      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("List home items error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Lỗi khi lấy danh sách vật phẩm",
      };
    }
  },
  getHomeItemById: async (homeItemId) => {
    try {
      const url = `/HomeItem/${homeItemId}`;
      const res = await axiosClient.get(url);

      if (ENABLE_DEBUG)
        console.log(`Get home item ${homeItemId} success:`, res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG)
        console.error(`Get home item ${homeItemId} error:`, error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Lỗi khi lấy chi tiết vật phẩm",
      };
    }
  },

  updateHomeItem: async (homeItemId, data) => {
    try {
      const res = await axiosClient.put(`/HomeItem/${homeItemId}`, data);

      if (ENABLE_DEBUG)
        console.log(`Update home item ${homeItemId} success:`, res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG)
        console.error(`Update home item ${homeItemId} error:`, error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Cập nhật vật phẩm thất bại",
      };
    }
  },

  scanHomeItem: async (files) => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const res = await axiosClient.post("/ocr/scan-homeitem", formData, {});

      if (ENABLE_DEBUG) console.log("Scan home item success:", res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Scan home item error:", error);

      let errorMessage = "Quét vật phẩm thất bại";

      if (error.response) {
        const responseData = error.response.data;
        const status = error.response.status;

        if (status === 400) {
          errorMessage =
            "File không đúng định dạng hoặc không hợp lệ. Vui lòng chọn ảnh JPG, JPEG hoặc PNG.";
        } else if (status === 413) {
          errorMessage = "File quá lớn. Vui lòng chọn file nhỏ hơn 5MB.";
        } else if (status === 415) {
          errorMessage =
            "Định dạng file không được hỗ trợ. Chỉ chấp nhận ảnh JPG, JPEG, PNG.";
        } else if (status >= 500) {
          errorMessage = "Lỗi server. Vui lòng thử lại sau.";
        } else {
          errorMessage =
            responseData?.message ||
            responseData?.error ||
            responseData?.title ||
            responseData?.Message ||
            responseData?.Error ||
            `Lỗi không xác định (${status})`;
        }

        if (responseData?.errors && typeof responseData.errors === "object") {
          const errorValues = Object.values(responseData.errors).flat();
          if (errorValues.length > 0) {
            errorMessage = errorValues.join(", ");
          }
        }
      } else if (error.request) {
        errorMessage =
          "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
      } else {
        errorMessage = error.message || "Lỗi không xác định khi quét ảnh";
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  deleteHomeItem: async (homeItemId) => {
    try {
      const res = await axiosClient.delete(`/HomeItem/${homeItemId}`);

      if (ENABLE_DEBUG)
        console.log(`Delete home item ${homeItemId} success:`, res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG)
        console.error(`Delete home item ${homeItemId} error:`, error);
      return {
        success: false,
        message: error.response?.data?.message || "Xóa vật phẩm thất bại",
      };
    }
  },
};
