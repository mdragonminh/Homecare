import axiosClient from "../config/axiosClient"; 

const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG === "true";

export const serviceApi = {
    /**
     * Lấy danh sách các dịch vụ theo danh mục.
     * Endpoint: GET /api/HomeService/services
     * @returns {Promise<{success: boolean, data?: Array, message?: string}>} 
     */
    getServices: async () => {
        try {
          
            const url = "/HomeService/services";
            const res = await axiosClient.get(url);
            if (ENABLE_DEBUG) console.log("Service API: Fetch successful, returning data.");
            return { success: true, data: res.data };
            
        } catch (error) {
           
            if (ENABLE_DEBUG) console.error("Service API: Error fetching services.", error);
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

    /**
    * @param {string} address - Địa chỉ của vị trí tìm kiếm.
     * @param {number} maxDistanceKm - Bán kính tìm kiếm (km).
     * @param {Array<string>} [serviceIds=[]] - Danh sách Service IDs để lọc.
     * @returns {Promise<{success: boolean, data?: Array, message?: string}>} 
     */
    getNearbyTechnicians: async (address, maxDistanceKm, serviceIds = []) => {
  try {
    if (!address || address.trim() === "") throw new Error("Thiếu địa chỉ!");

    const params = new URLSearchParams({
      Address: address,
      MaxDistanceKm: maxDistanceKm || 10,
    });
    serviceIds.forEach(id => params.append("ServiceIds", id));

    const url = `/ServiceRequest/nearby-technicians?${params.toString()}`;
    const res = await axiosClient.get(url);

    if (ENABLE_DEBUG) console.log("Technicians API: Fetch successful", res.data);
    return { success: true, data: res.data };

  } catch (error) {
    if (ENABLE_DEBUG) console.error("Technicians API: Error fetching technicians.", error);
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

};