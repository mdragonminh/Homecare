import axiosClient from "../config/axiosClient";

const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG === "true";

export const serviceApi = {

  getServices: async () => {
    try {
      const url = "/HomeService/services-homepage";
      const res = await axiosClient.get(url);
      if (ENABLE_DEBUG)
        console.log("Service API: Fetch successful, returning data.");
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG)
        console.error("Service API: Error fetching services.", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Lỗi khi lấy danh sách dịch vụ",
      };
    }
  },

  getNearbyTechnicians: async (address, maxDistanceKm) => {
    try {
      if (!address || address.trim() === "") throw new Error("Thiếu địa chỉ!");

      const params = new URLSearchParams({
        Address: address,
        MaxDistanceKm: maxDistanceKm || 10,
      });

      const url = `/ServiceRequest/nearby-technicians?${params.toString()}`;
      const res = await axiosClient.get(url);

      if (ENABLE_DEBUG)
        console.log("Technicians API: Fetch successful", res.data);
      return { success: true, data: res.data };
    } catch (error) {
      if (ENABLE_DEBUG)
        console.error("Technicians API: Error fetching technicians.", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Lỗi khi tìm kiếm kỹ thuật viên",
      };
    }
  },

  createAndMatchBooking: async (address, serviceIds, customerId, distanceKm = 0,desiredDateTime) => {
    try {
    
      if (!address || address.trim() === "") {
        throw new Error("Địa chỉ không được để trống.");
      }
      
      if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
        throw new Error("Vui lòng chọn ít nhất một dịch vụ.");
      }
      
      if (!customerId) {
        throw new Error("Thiếu thông tin khách hàng (customerId).");
      }
      if (!desiredDateTime) {
          throw new Error("Thiếu thông tin ngày giờ yêu cầu (desiredDateTime).");
      }
      const url = "/ServiceRequest/create-and-match-booking";
      
      
      const payload = {
        address: address.trim(),
        serviceIds: serviceIds, 
        customerId: customerId,
        distanceKm: Number(distanceKm) || 0,
        desiredDateTime: desiredDateTime
      };

      if (ENABLE_DEBUG) {
        console.log("=== CREATE BOOKING API ===");
        console.log("URL:", url);
        console.log("Payload:", JSON.stringify(payload, null, 2));
      }

      const res = await axiosClient.post(url, payload);

      if (ENABLE_DEBUG) {
        console.log("Create Booking API: Success");
        console.log("Response:", res.data);
      }
        
      return { 
        success: true, 
        data: res.data,
        message: "Đã tạo yêu cầu thành công!"
      };

    } catch (error) {
      if (ENABLE_DEBUG) {
        console.error("=== CREATE BOOKING API ERROR ===");
        console.error("Error:", error);
        console.error("Response data:", error.response?.data);
        console.error("Response status:", error.response?.status);
      }
      
     
      let errorMessage = "Lỗi khi tạo yêu cầu và đặt lịch";
      
      if (error.response) {
        
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          errorMessage = data?.message || data?.error || "Dữ liệu không hợp lệ";
        } else if (status === 401) {
          errorMessage = "Bạn cần đăng nhập để thực hiện chức năng này";
        } else if (status === 404) {
          errorMessage = "Không tìm thấy dịch vụ hoặc kỹ thuật viên phù hợp";
        } else if (status === 500) {
          errorMessage = "Lỗi máy chủ, vui lòng thử lại sau";
        } else {
          errorMessage = data?.message || data?.error || errorMessage;
        }
      } else if (error.request) {
       
        errorMessage = "Không thể kết nối đến máy chủ";
      } else {
      
        errorMessage = error.message || errorMessage;
      }
        
      return {
        success: false,
        message: errorMessage,
      };
    }
  },
};