import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { warehouseApi } from "../../services/warehouseApi";
import { mapApi } from "../../services/mapApi";
import { toast } from "sonner";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BuildingStorefrontIcon,
  UserIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
} from "@react-google-maps/api";

const WarehousePage = () => {
  const { t } = useTranslation();

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places', 'geometry']
  });

  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    totalCount: 0,
  });

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    managerId: "",
  });

  const [markerPosition, setMarkerPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState({
    lat: 21.028511,
    lng: 105.804817,
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [tempAddress, setTempAddress] = useState("");

  useEffect(() => {
    fetchWarehouses();
    fetchUsers();
  }, [pagination.currentPage, searchTerm]);

  useEffect(() => {
    if (loadError) {
      console.error("Error loading Google Maps script:", loadError);
      toast.error("Failed to load Google Maps. Please check API key configuration.");
    }
  }, [loadError]);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await warehouseApi.getAllWarehouses(
        pagination.currentPage,
        pagination.pageSize,
        searchTerm
      );
      setWarehouses(response.items || []);
      setPagination((prev) => ({
        ...prev,
        totalPages: response.totalPages || 0,
        totalCount: response.totalCount || 0,
      }));
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      const errorMessage = error.response?.data?.message || "Failed to load warehouses";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const managerList = await warehouseApi.getWarehouseManagers();
      setUsers(managerList);
    } catch (error) {
      console.error("Error fetching managers:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to load manager list";
      toast.error(errorMessage);
    }
  };

  const handleMapClick = useCallback(async (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    const newPos = { lat, lng };
    setMarkerPosition(newPos);

    try {
      const data = await mapApi.getAddress(lat, lng);
      setFormData((prev) => ({ ...prev, address: data.address }));
      setTempAddress(data.address);
      toast.success("Address selected");
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      toast.error(
        error.response?.data?.message || "Failed to get address for location"
      );
      const addressText = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
      setFormData((prev) => ({ ...prev, address: addressText }));
      setTempAddress(addressText);
    }
  }, []);

  const handleSearchAddress = async () => {
    if (!tempAddress.trim()) {
      toast.error("Please enter an address");
      return;
    }

    try {
      const coords = await mapApi.getCoordinates(tempAddress);
      const pos = { lat: coords.latitude, lng: coords.longitude };
      setMapCenter(pos);
      setMarkerPosition(pos);
      setFormData((prev) => ({ ...prev, address: tempAddress }));
      toast.success("Address found on map");
    } catch (error) {
      console.error("Error geocoding address:", error);
      toast.error(error.response?.data?.message || "Could not find address");
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const newPos = { lat, lng };
        
        setMapCenter(newPos);
        setMarkerPosition(newPos);

        try {
          const data = await mapApi.getAddress(lat, lng);
          setFormData((prev) => ({ ...prev, address: data.address }));
          setTempAddress(data.address);
          toast.success("Current location detected");
        } catch (error) {
          console.error("Error getting address:", error);
          const addressText = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
          setFormData((prev) => ({ ...prev, address: addressText }));
          setTempAddress(addressText);
          toast.success("Current location set");
        }
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Could not get your location. Please enable location services.");
        setIsGettingLocation(false);
      }
    );
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const openCreateModal = () => {
    setEditingWarehouse(null);
    setFormData({ name: "", address: "", managerId: "" });
    setTempAddress("");
    setShowModal(true);
    setMarkerPosition(null);
    setMapCenter({ lat: 21.028511, lng: 105.804817 });
  };

  const openEditModal = async (warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      address: warehouse.address,
      managerId: warehouse.managerId || "",
    });
    setTempAddress(warehouse.address);
    setShowModal(true);
    setMarkerPosition(null);

    if (warehouse.address) {
      try {
        const coords = await mapApi.getCoordinates(warehouse.address);
        const pos = { lat: coords.latitude, lng: coords.longitude };
        setMapCenter(pos);
        setMarkerPosition(pos);
      } catch (error) {
        console.error("Error geocoding address:", error);
        toast.error(
          error.response?.data?.message || "Could not find address on map"
        );
        setMapCenter({ lat: 21.028511, lng: 105.804817 });
      }
    } else {
      setMapCenter({ lat: 21.028511, lng: 105.804817 });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingWarehouse(null);
    setFormData({ name: "", address: "", managerId: "" });
    setTempAddress("");
    setMarkerPosition(null);
    setMapCenter({ lat: 21.028511, lng: 105.804817 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        managerId: formData.managerId || null,
      };

      if (editingWarehouse) {
        await warehouseApi.updateWarehouse(editingWarehouse.id, submitData);
        toast.success("Warehouse updated successfully");
      } else {
        await warehouseApi.createWarehouse(submitData);
        toast.success("Warehouse created successfully");
      }
      closeModal();
      fetchWarehouses();
    } catch (error) {
      console.error("Error saving warehouse:", error);
      toast.error(error.response?.data?.message || "Failed to save warehouse");
    }
  };

  const handleDelete = async (warehouse) => {
    if (
      window.confirm(
        `Are you sure you want to delete warehouse "${warehouse.name}"?`
      )
    ) {
      try {
        await warehouseApi.deleteWarehouse(warehouse.id);
        toast.success("Warehouse deleted successfully");
        fetchWarehouses();
      } catch (error) {
        console.error("Error deleting warehouse:", error);
        toast.error(
          error.response?.data?.message || "Failed to delete warehouse"
        );
      }
    }
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          <BuildingStorefrontIcon className="w-8 h-8 inline mr-2" />
          {t("warehouse.title", "Warehouse Management")}
        </h1>
        <p className="text-gray-600">
          {t(
            "warehouse.description",
            "Manage warehouses and their information"
          )}
        </p>
      </div>
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
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
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          {t("warehouse.add", "Add Warehouse")}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("warehouse.name", "Name")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("warehouse.address", "Address")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("warehouse.manager", "Manager")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("warehouse.equipments", "Equipments")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("common.actions", "Actions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  {t("common.loading", "Loading...")}
                </td>
              </tr>
            ) : warehouses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  {t("warehouse.noData", "No warehouses found")}
                </td>
              </tr>
            ) : (
              warehouses.map((warehouse) => (
                <tr key={warehouse.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {warehouse.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {warehouse.address}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {warehouse.managerName ||
                          t("warehouse.noManager", "No Manager")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {warehouse.totalEquipments || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openEditModal(warehouse)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(warehouse)}
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
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{pagination.currentPage}</span> of{" "}
                    <span className="font-medium">{pagination.totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{ background: "rgba(1,1,1, 0.5)" }}
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
        >
          <div className="relative top-10 mx-auto p-5 border w-full max-w-xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingWarehouse
                  ? t("warehouse.edit", "Edit Warehouse")
                  : t("warehouse.add", "Add Warehouse")}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("warehouse.name", "Name")} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("warehouse.address", "Address")} *
                  </label>
                  
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tempAddress}
                      onChange={(e) => setTempAddress(e.target.value)}
                      placeholder={t(
                        "warehouse.enterAddress",
                        "Enter address or select on map..."
                      )}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchAddress();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSearchAddress}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2 whitespace-nowrap"
                    >
                      <MagnifyingGlassIcon className="w-4 h-4" />
                      {t("common.search", "Search")}
                    </button>
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      disabled={isGettingLocation}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 whitespace-nowrap disabled:bg-gray-400"
                      title={t("warehouse.currentLocation", "Use current location")}
                    >
                      <MapPinIcon className="w-4 h-4" />
                      {isGettingLocation ? "..." : t("warehouse.myLocation", "My Location")}
                    </button>
                  </div>

                  {/* <input
                    type="text"
                    required
                    readOnly
                    value={formData.address}
                    placeholder={t(
                      "warehouse.addressWillAppear",
                      "Selected address will appear here..."
                    )}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none bg-gray-50 cursor-not-allowed text-sm mb-2"
                  /> */}

                  {!isLoaded ? (
                    <div className="w-full h-[300px] flex items-center justify-center bg-gray-100 text-gray-500">
                      {t("common.loading", "Loading...")}
                    </div>
                  ) : loadError ? (
                    <div className="w-full h-[300px] flex items-center justify-center bg-red-50 text-red-700">
                      Error loading map.
                    </div>
                  ) : (
                    <GoogleMap
                      mapContainerStyle={{ width: "100%", height: "300px" }}
                      center={mapCenter}
                      zoom={15}
                      onClick={handleMapClick}
                    >
                      {markerPosition && <Marker position={markerPosition} />}
                    </GoogleMap>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("warehouse.manager", "Manager")}
                  </label>
                  <select
                    value={formData.managerId}
                    onChange={(e) =>
                      setFormData({ ...formData, managerId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">
                      {t("warehouse.selectManager", "Select Manager")}
                    </option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

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
                    {editingWarehouse
                      ? t("common.update", "Update")
                      : t("common.create", "Create")}
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

export default WarehousePage;