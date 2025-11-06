import { warehouseApi } from "./warehouseApi"; 

export const equipmentApi = {
  getEquipmentList: async (params) => {
    try {
      const data = await warehouseApi.getAllEquipments(
        params.PageNumber,
        params.PageSize,
        "" 
      );

      return { success: true, data: data };
    } catch (error) {
      console.error("Get Equipment List Error:", error);
      return { success: false, message: error.response?.data?.message || "Lỗi khi tải danh sách thiết bị." };
    }
  },
};