import axios from "axios";

// Lấy biến môi trường từ .env
const API_URL = import.meta.env.VITE_API_URL;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG === "true";

export const homeApi = {
  // Hàm lấy tọa độ từ địa chỉ bằng Geocoding API
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

  // Hàm tạo Home, tự động lấy lat/lng nếu chưa cung cấp
  createHome: async ({ name, address, latitude, longitude, customerProfileId }) => {
    try {
      let lat = latitude;
      let lng = longitude;

      if (!lat || !lng) {
        const geocodeResult = await homeApi.geocodeAddress(address);
        if (!geocodeResult.success) throw new Error(geocodeResult.message);
        lat = geocodeResult.latitude;
        lng = geocodeResult.longitude;
      }

      // Lấy token ngay trước khi gọi API
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const res = await axios.post(
        `${API_URL}/Home/create-home`,
        {
          name,
          address,
          latitude: lat,
          longitude: lng,
          customerProfileId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

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

  // Hàm lấy danh sách home của user hiện tại
  getHomesOfCurrentUser: async (
    page = 1,
    pageSize = 10,
    searchTerm = "",
    type = "all"
  ) => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const queryParams = new URLSearchParams({
        pageNumber: page,
        pageSize: pageSize,
        ...(searchTerm && { searchTerm }),
        ...(type !== "all" && { type }),
      }).toString();

      const url = `${API_URL}/Home/list-home?${queryParams}`;

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (ENABLE_DEBUG) console.log("Get homes success:", res.data);

      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Get homes error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Lỗi khi lấy danh sách địa chỉ",
      };
    }
  },

  // Hàm thêm vật phẩm vào Home
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
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const res = await axios.post(
        `${API_URL}/HomeItem/add-home-item`,
        {
          name,
          brand,
          type,
          modelNumber,
          serialNumber,
          notes,
          homeId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (ENABLE_DEBUG) console.log("Add home item success:", res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Add home item error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || error.message || "Thêm vật phẩm thất bại",
      };
    }
  },

  // Hàm lấy danh sách vật phẩm của Home
  listHomeItems: async (homeId, page = 1, pageSize = 10, searchTerm = "") => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const queryParams = new URLSearchParams({
        homeId: homeId,
        pageNumber: page,
        pageSize: pageSize,
        ...(searchTerm && { searchTerm }),
      }).toString();

      const url = `${API_URL}/HomeItem/list-home-item?${queryParams}`;

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (ENABLE_DEBUG) console.log("List home items success:", res.data);

      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("List home items error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Lỗi khi lấy danh sách vật phẩm",
      };
    }
  },
};
