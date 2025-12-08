import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { warehouseApi } from "../../services/warehouseApi";
import { toast } from "sonner";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
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

  const [quantityData, setQuantityData] = useState({
    quantity: 0,
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [equipmentToDelete, setEquipmentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Validate name
    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = "Không được để trống tên thiết bị";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Tên thiết bị phải có ít nhất 2 ký tự";
    }

    // Validate equipment code
    if (!formData.equipmentCode || formData.equipmentCode.trim().length === 0) {
      newErrors.equipmentCode = "Không được để trống mã thiết bị";
    } else if (formData.equipmentCode.trim().length < 2) {
      newErrors.equipmentCode = "Mã thiết bị phải có ít nhất 2 ký tự";
    }

    // Validate brand
    if (!formData.brand || formData.brand.trim().length === 0) {
      newErrors.brand = t("equipment.validation.brandRequired", "Không được để trống nhãn hiệu");
    } else if (formData.brand.trim().length < 2) {
      newErrors.brand = t("equipment.validation.brandMinLength", "Nhãn hiệu phải có ít nhất 2 ký tự");
    }

    // Validate model number
    if (!formData.modelNumber || formData.modelNumber.trim().length === 0) {
      newErrors.modelNumber = t("equipment.validation.modelRequired", "Không được để trống số Model");
    } else if (formData.modelNumber.trim().length < 2) {
      newErrors.modelNumber = t("equipment.validation.modelMinLength", "Số Model phải có ít nhất 2 ký tự");
    }

    // Validate quantity
    if (formData.quantity < 0) {
      newErrors.quantity = "Số lượng không được âm";
    }
    if (formData.quantity > 999999) {
      newErrors.quantity = "Số lượng quá lớn";
    }

    // Validate unit price
    if (formData.unitPrice == 0) {
      newErrors.unitPrice = "Giá bán phải lớn hơn 0";
    }
    if (formData.unitPrice > 999999999999) {
      newErrors.unitPrice = "Giá bán quá lớn";
    }

    // Validate cost price
    if (formData.costPrice == 0) {
      newErrors.costPrice = "Giá nhập phải lớn hơn 0";
    }
    if (formData.costPrice > 999999999999) {
      newErrors.costPrice = "Giá nhập quá lớn";
    }
    if (formData.costPrice > formData.unitPrice && formData.unitPrice > 0) {
      newErrors.costPrice = "Giá nhập không được cao hơn giá bán";
    }

    // Validate warranty
    if (formData.warrantyDurationMonths < 0) {
      newErrors.warrantyDurationMonths = "Thời gian bảo hành không được âm";
    }
    if (formData.warrantyDurationMonths > 600) {
      newErrors.warrantyDurationMonths = "Thời gian bảo hành quá dài (tối đa 600 tháng)";
    }

    // Validate description
    if (formData.description && formData.description.trim().length > 0 && formData.description.trim().length < 10) {
      newErrors.description = "Mô tả phải có ít nhất 10 ký tự";
    }
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = "Mô tả không được vượt quá 1000 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
    setErrors({});
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
    setErrors({});
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
    setErrors({});
  };

  const closeQuantityModal = () => {
    setShowQuantityModal(false);
    setQuantityEquipment(null);
    setQuantityData({ quantity: 0, notes: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Vui lòng sửa các lỗi trước khi lưu");
      return;
    }

    try {
      if (editingEquipment) {
        await warehouseApi.updateEquipment(editingEquipment.id, formData);
        toast.success("Cập nhật thiết bị thành công");
      } else {
        await warehouseApi.createEquipment(formData);
        toast.success("Tạo thiết bị thành công");
      }

      closeModal();
      fetchEquipments();
    } catch (error) {
      console.error("Error saving equipment:", error);
      toast.error(error.response?.data?.message || "Failed to save equipment");
    }
  };

  const handleQuantityUpdate = async (e) => {
    e.preventDefault();
    try {
      await warehouseApi.updateEquipmentQuantity(quantityEquipment.id, {
        quantity: quantityData.quantity,
      });
      toast.success("Cập nhật số lượng thiết bị thành công");
      closeQuantityModal();
      fetchEquipments();
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error(error.response?.data?.message || "Failed to update quantity");
    }
  };

  const handleDeleteClick = (equipment) => {
    setEquipmentToDelete(equipment);
  };

  const handleDeleteConfirm = async () => {
    if (!equipmentToDelete) return;

    setIsDeleting(true);
    try {
      await warehouseApi.deleteEquipment(equipmentToDelete.id);
      toast.success("Xóa thiết bị thành công");
      setEquipmentToDelete(null);
      fetchEquipments();
    } catch (error) {
      console.error("Error deleting equipment:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete equipment"
      );
    } finally {
      setIsDeleting(false);
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
                      onClick={() => handleDeleteClick(equipment)}
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
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: null });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.name ? "border-red-500" : "border-gray-300"
                          }`}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("equipment.equipmentCode", "Equipment Code")} *
                      </label>
                      <input
                        type="text"
                        value={formData.equipmentCode}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            equipmentCode: e.target.value,
                          });
                          if (errors.equipmentCode) setErrors({ ...errors, equipmentCode: null });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.equipmentCode ? "border-red-500" : "border-gray-300"
                          }`}
                      />
                      {errors.equipmentCode && (
                        <p className="mt-1 text-sm text-red-600">{errors.equipmentCode}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("equipment.brand", "Brand")}
                      </label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => {
                          setFormData({ ...formData, brand: e.target.value });
                          if (errors.brand) setErrors({ ...errors, brand: null });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.brand ? "border-red-500" : "border-gray-300"
                          }`}
                      />
                      {errors.brand && (
                        <p className="mt-1 text-sm text-red-600">{errors.brand}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("equipment.modelNumber", "Model Number")}
                      </label>
                      <input
                        type="text"
                        value={formData.modelNumber}
                        onChange={(e) => {
                          setFormData({ ...formData, modelNumber: e.target.value });
                          if (errors.modelNumber) setErrors({ ...errors, modelNumber: null });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.modelNumber ? "border-red-500" : "border-gray-300"
                          }`}
                      />
                      {errors.modelNumber && (
                        <p className="mt-1 text-sm text-red-600">{errors.modelNumber}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("equipment.equipmentDescription", "Description")}
                      </label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => {
                          setFormData({ ...formData, description: e.target.value });
                          if (errors.description) setErrors({ ...errors, description: null });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.description ? "border-red-500" : "border-gray-300"
                          }`}
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {formData.description.length}/1000 ký tự
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("equipment.warehouse", "Warehouse")} *
                      </label>
                      <select
                        required
                        value={formData.warehouseId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            warehouseId: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">
                          {t("equipment.selectWarehouse", "Select Warehouse")}
                        </option>
                        {warehouses.map((warehouse) => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </option>
                        ))}
                      </select>
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
                          max="999999"
                          value={formData.quantity}
                          onChange={(e) => {
                            setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 });
                            if (errors.quantity) setErrors({ ...errors, quantity: null });
                          }}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.quantity ? "border-red-500" : "border-gray-300"
                            }`}
                        />
                        {errors.quantity && (
                          <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Giá bán *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="999999999999"
                          step="1000"
                          value={formData.unitPrice}
                          onChange={(e) => {
                            setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 });
                            if (errors.unitPrice) setErrors({ ...errors, unitPrice: null });
                          }}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.unitPrice ? "border-red-500" : "border-gray-300"
                            }`}
                        />
                        {errors.unitPrice && (
                          <p className="mt-1 text-sm text-red-600">{errors.unitPrice}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Giá nhập *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="999999999999"
                          step="1000"
                          value={formData.costPrice}
                          onChange={(e) => {
                            setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 });
                            if (errors.costPrice) setErrors({ ...errors, costPrice: null });
                          }}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.costPrice ? "border-red-500" : "border-gray-300"
                            }`}
                        />
                        {errors.costPrice && (
                          <p className="mt-1 text-sm text-red-600">{errors.costPrice}</p>
                        )}
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
                        max="600"
                        value={formData.warrantyDurationMonths}
                        onChange={(e) => {
                          setFormData({ ...formData, warrantyDurationMonths: parseInt(e.target.value) || 0 });
                          if (errors.warrantyDurationMonths) setErrors({ ...errors, warrantyDurationMonths: null });
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.warrantyDurationMonths ? "border-red-500" : "border-gray-300"
                          }`}
                      />
                      {errors.warrantyDurationMonths && (
                        <p className="mt-1 text-sm text-red-600">{errors.warrantyDurationMonths}</p>
                      )}
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

      {/* Delete Confirmation Modal */}
      {equipmentToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white p-6 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-none sm:max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Xác nhận xóa thiết bị
              </h3>
            </div>
            <p className="text-gray-600 mb-2">
              Bạn có chắc chắn muốn xóa thiết bị này?
            </p>
            <p className="text-gray-900 font-semibold mb-4">
              "{equipmentToDelete.name}"
            </p>
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Hành động này không thể hoàn tác.</span>
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEquipmentToDelete(null)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                disabled={isDeleting}
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 shadow-sm transition-all duration-200 font-medium"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Xóa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentPage;