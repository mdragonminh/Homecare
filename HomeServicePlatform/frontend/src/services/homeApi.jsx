import axios from "axios";
import axiosClient from "../utils/axiosClient"; 
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

  // Hàm tạo Home, tự động lấy lat/lng nếu chưa cung cấp
  createHome: async ({ name, address, latitude, longitude, customerProfileId }) => {
    try {
      let lat = latitude;
      let lng = longitude;

      // Xử lý Geocoding nếu thiếu lat/lng
      if (!lat || !lng) {
        const geocodeResult = await homeApi.geocodeAddress(address);
        if (!geocodeResult.success) throw new Error(geocodeResult.message);
        lat = geocodeResult.latitude;
        lng = geocodeResult.longitude;
      }

      // ⭐️ Sử dụng axiosClient.post.
      // ⭐️ axiosClient đã tự động thêm Bearer Token và Content-Type: application/json
      const res = await axiosClient.post(
        "/Home/create-home", // Dùng relative path
        {
          name,
          address,
          latitude: lat,
          longitude: lng,
          customerProfileId,
        }
      );

      if (ENABLE_DEBUG) console.log("Create home success:", res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error("Create home error:", error);
      // Xử lý lỗi theo định dạng đã dùng trong authApi, nhưng giữ lại cú pháp cũ nếu cần
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
      // ⭐️ Không cần kiểm tra token thủ công nữa, Interceptor sẽ lo
      // if (!jwtToken) { throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại."); }

      const queryParams = new URLSearchParams({
        pageNumber: page,
        pageSize: pageSize,
        ...(searchTerm && { Search: searchTerm }),
        ...(type !== "all" && { type }),
      }).toString();

      const url = `/Home/list-home?${queryParams}`; // Dùng relative path

      // ⭐️ Sử dụng axiosClient.get. Bearer Token tự động được thêm
      const res = await axiosClient.get(url);

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

  // =================================================================================
  // CÁC API HOME BỔ SUNG (DELETE, PUT, GET BY ID)
  // =================================================================================

  // Hàm lấy chi tiết Home bằng ID (GET /api/Home/{homeId})
  getHomeById: async (homeId) => {
    try {
      // ⭐️ Không cần kiểm tra token thủ công
      const url = `/Home/${homeId}`; // Dùng relative path

      // ⭐️ Sử dụng axiosClient.get
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

  // Hàm cập nhật Home (PUT /api/Home/{homeId})
  updateHome: async (homeId, { name, address, latitude, longitude }) => {
    try {
      // ⭐️ Không cần kiểm tra token thủ công
      // ⭐️ Sử dụng axiosClient.put
      const res = await axiosClient.put(
        `/Home/${homeId}`, // Dùng relative path
        {
          name,
          address,
          latitude,
          longitude,
          // Có thể cần thêm các trường khác nếu API yêu cầu
        }
        // ⭐️ Không cần truyền headers nữa
      );

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

  // Hàm xóa Home (DELETE /api/Home/{homeId})
  deleteHome: async (homeId) => {
    try {
      // ⭐️ Không cần kiểm tra token thủ công
      // ⭐️ Sử dụng axiosClient.delete
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

  // =================================================================================
  // CÁC API HOME ITEM ĐÃ CÓ
  // =================================================================================

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
      // ⭐️ Không cần kiểm tra token thủ công
      // ⭐️ Sử dụng axiosClient.post
      const res = await axiosClient.post(
        "/HomeItem/add-home-item", // Dùng relative path
        {
          name,
          brand,
          type,
          modelNumber,
          serialNumber,
          notes,
          homeId,
        }
        // ⭐️ Không cần truyền headers nữa
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
      // ⭐️ Không cần kiểm tra token thủ công

      const queryParams = new URLSearchParams({
        homeId: homeId,
        pageNumber: page,
        pageSize: pageSize,
        ...(searchTerm && { Search: searchTerm }),
      }).toString();

      const url = `/HomeItem/list-home-item?${queryParams}`; // Dùng relative path

      // ⭐️ Sử dụng axiosClient.get
      const res = await axiosClient.get(url);

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
   getHomeItemById: async (homeItemId) => {
    try {
      const url = `/HomeItem/${homeItemId}`;
      const res = await axiosClient.get(url);

      if (ENABLE_DEBUG) console.log(`Get home item ${homeItemId} success:`, res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error(`Get home item ${homeItemId} error:`, error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Lỗi khi lấy chi tiết vật phẩm",
      };
    }
  },

  // Hàm cập nhật HomeItem (PUT /api/HomeItem/{homeItemId})
  updateHomeItem: async (homeItemId, data) => { // 'data' chứa các trường cần cập nhật
    try {
      const res = await axiosClient.put(
        `/HomeItem/${homeItemId}`,
        data // Ví dụ: { name, brand, type, modelNumber, serialNumber, notes, homeId }
      );

      if (ENABLE_DEBUG) console.log(`Update home item ${homeItemId} success:`, res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error(`Update home item ${homeItemId} error:`, error);
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

  // Hàm xóa HomeItem (DELETE /api/HomeItem/{homeItemId})
  deleteHomeItem: async (homeItemId) => {
    try {
      const res = await axiosClient.delete(`/HomeItem/${homeItemId}`);

      if (ENABLE_DEBUG) console.log(`Delete home item ${homeItemId} success:`, res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG) console.error(`Delete home item ${homeItemId} error:`, error);
      return {
        success: false,
        message: error.response?.data?.message || "Xóa vật phẩm thất bại",
      };
    }
  },
};