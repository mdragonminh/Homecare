import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { warehouseApi } from "../../services/warehouseApi";
import { toast } from "sonner";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  WrenchScrewdriverIcon,
  BuildingStorefrontIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

const EquipmentPage = () => {
  const { t } = useTranslation();
  const [equipments, setEquipments] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [quantityEquipment, setQuantityEquipment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    totalCount: 0,
  });

  const initialFormData = {
    name: "",
    equipmentCode: "",
    description: "",
    warehouseId: "",
    quantity: 0,
    brand: "",
    modelNumber: "",
    unitOfMeasure: "Cái",
    unitPrice: 0,
    costPrice: 0,
    warrantyDurationMonths: 0,
    isActive: true,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [quantityData, setQuantityData] = useState({
    quantity: 0,
    notes: "",
  });

  useEffect(() => {
    fetchEquipments();
    fetchWarehouses();
  }, [pagination.currentPage, searchTerm, filterWarehouse]);

  const fetchEquipments = async () => {
    try {
      setLoading(true);
      const response = await warehouseApi.getAllEquipments(
        pagination.currentPage,
        pagination.pageSize,
        searchTerm,
        filterWarehouse
      );
      setEquipments(response.items || []);
      setPagination((prev) => ({
        ...prev,
        totalPages: response.totalPages || 0,
        totalCount: response.totalCount || 0,
      }));
    } catch (error) {
      console.error("Error fetching equipments:", error);
      toast.error("Failed to load equipments");
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseApi.getAllWarehouses(1, 100);
      setWarehouses(response.items || []);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleWarehouseFilter = (e) => {
    setFilterWarehouse(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  const openCreateModal = () => {
    setEditingEquipment(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const openEditModal = (equipment) => {
    setEditingEquipment(equipment);
    setFormData({
      name: equipment.name,
      equipmentCode: equipment.equipmentCode || "",
      description: equipment.description || "",
      warehouseId: equipment.warehouseId,
      quantity: equipment.quantity,
      brand: equipment.brand || "",
      modelNumber: equipment.modelNumber || "",
      unitOfMeasure: equipment.unitOfMeasure || "Cái",
      unitPrice: equipment.unitPrice || 0,
      costPrice: equipment.costPrice || 0,
      warrantyDurationMonths: equipment.warrantyDurationMonths || 0,
      isActive: equipment.isActive,
    });
    setShowModal(true);
  };

  const openQuantityModal = (equipment) => {
    setQuantityEquipment(equipment);
    setQuantityData({ quantity: equipment.quantity, notes: "" });
    setShowQuantityModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEquipment(null);
    setFormData(initialFormData);
  };

  const closeQuantityModal = () => {
    setShowQuantityModal(false);
    setQuantityEquipment(null);
    setQuantityData({ quantity: 0, notes: "" });
  };
  const validateEquipmentForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim() === "") {
      newErrors.Name = "Tên thiết bị không được để trống";
    }

    if (!formData.equipmentCode || formData.equipmentCode.trim() === "") {
      newErrors.EquipmentCode = "Mã thiết bị không được để trống";
    }

    if (!formData.warehouseId || formData.warehouseId.trim() === "") {
      newErrors.WarehouseId = "Vui lòng chọn kho";
    }

    if (formData.quantity < 0) {
      newErrors.Quantity = "Số lượng không thể nhỏ hơn 0";
    }

    if (formData.unitPrice < 0) {
      newErrors.UnitPrice = "Giá bán không thể nhỏ hơn 0";
    }

    if (formData.costPrice < 0) {
      newErrors.CostPrice = "Giá nhập không thể nhỏ hơn 0";
    }

    if (formData.warrantyDurationMonths < 0) {
      newErrors.Warranty = "Số tháng bảo hành không thể nhỏ hơn 0";
    }

    return newErrors;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const validationErrors = validateEquipmentForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      if (editingEquipment) {
        await warehouseApi.updateEquipment(editingEquipment.id, formData);
        toast.success("Equipment updated successfully");
      } else {
        await warehouseApi.createEquipment(formData);
        toast.success("Equipment created successfully");
      }

      closeModal();
      fetchEquipments();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save equipment");
    }
  };

  const handleQuantityUpdate = async (e) => {
    e.preventDefault();
    try {
      await warehouseApi.updateEquipmentQuantity(quantityEquipment.id, {
        quantity: quantityData.quantity,
      });
      toast.success("Equipment quantity updated successfully");
      closeQuantityModal();
      fetchEquipments();
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error(error.response?.data?.message || "Failed to update quantity");
    }
  };

  const handleDelete = async (equipment) => {
    if (
      window.confirm(
        `Are you sure you want to delete equipment "${equipment.name}"?`
      )
    ) {
      try {
        await warehouseApi.deleteEquipment(equipment.id);
        toast.success("Equipment deleted successfully");
        fetchEquipments();
      } catch (error) {
        console.error("Error deleting equipment:", error);
        toast.error(
          error.response?.data?.message || "Failed to delete equipment"
        );
      }
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          <WrenchScrewdriverIcon className="w-8 h-8 inline mr-2" />
          {t("equipment.title", "Equipment Management")}
        </h1>
        <p className="text-gray-600">
          {t("equipment.description", "Manage equipments and their inventory")}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t("common.search", "Search...")}
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <BuildingStorefrontIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterWarehouse}
              onChange={handleWarehouseFilter}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
              <option value="">
                {t("equipment.allWarehouses", "All Warehouses")}
              </option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          {t("equipment.add", "Add Equipment")}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("equipment.name", "Name")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("equipment.brand", "Brand / Model")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("equipment.location", "Location")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("equipment.stock", "Stock")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("common.status", "Status")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("common.actions", "Actions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  {t("common.loading", "Loading...")}
                </td>
              </tr>
            ) : equipments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  {t("equipment.noData", "No equipments found")}
                </td>
              </tr>
            ) : (
              equipments.map((equipment) => (
                <tr key={equipment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {equipment.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {equipment.brand || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <BuildingStorefrontIcon className="w-4 h-4 mr-2 text-gray-400" />
                      {equipment.warehouseName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-5 py-2 text-xs font-semibold rounded-full mb-2 ${equipment.quantity > 0
                        ? equipment.quantity > 10
                          ? "bg-green-200 text-green-800"
                          : "bg-yellow-200 text-yellow-800"
                        : "bg-red-200 text-red-800"
                        }`}
                    >
                      {equipment.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {equipment.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                        <CheckCircleIcon className="w-4 h-4" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
                        <XCircleIcon className="w-4 h-4" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openQuantityModal(equipment)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Update Quantity"
                    >
                      <AdjustmentsHorizontalIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(equipment)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(equipment)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {t("common.previous", "Previous")}
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {t("common.next", "Next")}
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    {(pagination.currentPage - 1) * pagination.pageSize + 1} to{" "}
                    {Math.min(
                      pagination.currentPage * pagination.pageSize,
                      pagination.totalCount
                    )}{" "}
                    of {pagination.totalCount} results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === pagination.currentPage
                          ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div
          style={{ background: "rgba(1,1,1, 0.5)" }}
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
        >
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingEquipment
                  ? t("equipment.edit", "Edit Equipment")
                  : t("equipment.add", "Add Equipment")}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("equipment.name", "Name")} *
                      </label>
                      <input
                        type="text"
                        value={formData.equipmentCode}
                        onChange={(e) =>
                          setFormData({ ...formData, equipmentCode: e.target.value })
                        }
                        className={`w-full px-3 py-2 border rounded-md ${errors.EquipmentCode ? "border-red-500 bg-red-50" : "border-gray-300"
                          }`}
                      />
                      {errors.EquipmentCode && (
                        <p className="text-red-500 text-sm mt-1">{errors.EquipmentCode}</p>
                      )}

                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("equipment.equipmentCode", "Equipment Code")} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.equipmentCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            equipmentCode: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("equipment.brand", "Brand")}
                      </label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) =>
                          setFormData({ ...formData, brand: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("equipment.modelNumber", "Model Number")}
                      </label>
                      <input
                        type="text"
                        value={formData.modelNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            modelNumber: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("equipment.equipmentDescription", "Description")}
                      </label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("equipment.warehouse", "Warehouse")} *
                      </label>
                      <select
                        value={formData.warehouseId}
                        onChange={(e) =>
                          setFormData({ ...formData, warehouseId: e.target.value })
                        }
                        className={`w-full px-3 py-2 border rounded-md ${errors.WarehouseId ? "border-red-500 bg-red-50" : "border-gray-300"
                          }`}
                      >
                        <option value="">-- Chọn kho --</option>
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>

                      {errors.WarehouseId && (
                        <p className="text-red-500 text-sm mt-1">{errors.WarehouseId}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("equipment.unitOfMeasure", "Unit")} *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.unitOfMeasure}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              unitOfMeasure: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("equipment.quantity", "Quantity")} *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formData.quantity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              quantity: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("equipment.unitPrice", "Unit Price")} *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="1000"
                          value={formData.unitPrice}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              unitPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("equipment.costPrice", "Cost Price")} *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="1000"
                          value={formData.costPrice}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              costPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t(
                          "equipment.warrantyDurationMonths",
                          "Warranty (Months)"
                        )}{" "}
                        *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.warrantyDurationMonths}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            warrantyDurationMonths:
                              parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isActive: e.target.checked,
                            })
                          }
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{t("common.isActive", "Is Active")}</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    {t("common.cancel", "Cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingEquipment
                      ? t("common.update", "Update")
                      : t("common.create", "Create")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Quantity Update Modal */}
      {showQuantityModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t("equipment.updateQuantity", "Update Quantity")} -{" "}
                {quantityEquipment?.name}
              </h3>
              <form onSubmit={handleQuantityUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("equipment.currentQuantity", "Current Quantity")}
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {quantityEquipment?.quantity}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("equipment.newQuantity", "New Quantity")} *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={quantityData.quantity}
                    onChange={(e) =>
                      setQuantityData({
                        ...quantityData,
                        quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("equipment.notes", "Notes")}
                  </label>
                  <textarea
                    rows={3}
                    value={quantityData.notes}
                    onChange={(e) =>
                      setQuantityData({
                        ...quantityData,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Reason for quantity change..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeQuantityModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    {t("common.cancel", "Cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {t("equipment.updateQuantity", "Update Quantity")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentPage;