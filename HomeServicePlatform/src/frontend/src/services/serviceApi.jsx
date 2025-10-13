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
    * @param {number} lat - Vĩ độ của vị trí tìm kiếm.
     * @param {number} lng - Kinh độ của vị trí tìm kiếm.
     * @param {number} maxDistanceKm - Bán kính tìm kiếm (km).
     * @param {number} [minRating=0] - Điểm đánh giá tối thiểu.
     * @returns {Promise<{success: boolean, data?: Array, message?: string}>} 
     */
    getNearbyTechnicians: async (lat, lng, maxDistanceKm = 50, minRating = 0) => {
        try {
            const url = `/ServiceRequest/nearby-technicians?lat=${lat}&lng=${lng}&maxDistanceKm=${maxDistanceKm}&minRating=${minRating}`;
            const res = await axiosClient.get(url);

            if (ENABLE_DEBUG) console.log("Technicians API: Fetch successful, returning data.", res.data);
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