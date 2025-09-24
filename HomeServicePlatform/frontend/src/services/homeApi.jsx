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
        message:
          error.response?.data?.error_message || "Lỗi khi lấy tọa độ",
      };
    }
  },

  // Hàm tạo home, có thể tự động lấy lat/lng nếu chưa cung cấp
  createHome: async ({
    name,
    address,
    latitude,
    longitude,
    customerProfileId,
  }) => {
    try {
      // Nếu latitude hoặc longitude chưa có, gọi Geocoding API
      let lat = latitude;
      let lng = longitude;
      if (!lat || !lng) {
        const geocodeResult = await homeApi.geocodeAddress(address);
        if (!geocodeResult.success) throw new Error(geocodeResult.message);
        lat = geocodeResult.latitude;
        lng = geocodeResult.longitude;
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
          headers: { "Content-Type": "application/json" },
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
};