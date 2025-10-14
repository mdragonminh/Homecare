import axiosClient from "../config/axiosClient";

export const warehouseApi = {
  // Warehouse APIs
  getAllWarehouses: async (pageNumber = 1, pageSize = 10, searchTerm = "") => {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });

    if (searchTerm) {
      params.append("searchTerm", searchTerm);
    }

    const response = await axiosClient.get(`/warehouse?${params}`);
    return response.data;
  },

  getWarehouseById: async (id) => {
    const response = await axiosClient.get(`/warehouse/${id}`);
    return response.data;
  },

  createWarehouse: async (warehouseData) => {
    const response = await axiosClient.post("/warehouse", warehouseData);
    return response.data;
  },

  updateWarehouse: async (id, warehouseData) => {
    const response = await axiosClient.put(`/warehouse/${id}`, warehouseData);
    return response.data;
  },

  deleteWarehouse: async (id) => {
    await axiosClient.delete(`/warehouse/${id}`);
  },

  // Equipment APIs
  getAllEquipments: async (
    pageNumber = 1,
    pageSize = 10,
    searchTerm = "",
    warehouseId = ""
  ) => {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });

    if (searchTerm) {
      params.append("searchTerm", searchTerm);
    }

    if (warehouseId) {
      params.append("warehouseId", warehouseId);
    }

    const response = await axiosClient.get(`/equipment?${params}`);
    return response.data;
  },

  getEquipmentById: async (id) => {
    const response = await axiosClient.get(`/equipment/${id}`);
    return response.data;
  },

  createEquipment: async (equipmentData) => {
    const response = await axiosClient.post("/equipment", equipmentData);
    return response.data;
  },

  updateEquipment: async (id, equipmentData) => {
    const response = await axiosClient.put(`/equipment/${id}`, equipmentData);
    return response.data;
  },

  updateEquipmentQuantity: async (id, quantityData) => {
    const response = await axiosClient.patch(
      `/equipment/${id}/quantity`,
      quantityData
    );
    return response.data;
  },

  deleteEquipment: async (id) => {
    await axiosClient.delete(`/equipment/${id}`);
  },
};
