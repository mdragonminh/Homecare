import axiosClient from "../config/axiosClient"; 


export const supplierApi = {
  getAllSuppliers: async (paginationParams) => {
    try {
      const res = await axiosClient.get("/supplier", { params: paginationParams });
      
      return { success: true, data: res.data };
    } catch (error) {
      console.error("Get All Suppliers Error:", error);
      return { success: false, message: error.response?.data?.message || "Lỗi khi tải danh sách nhà cung cấp." };
    }
  }
};