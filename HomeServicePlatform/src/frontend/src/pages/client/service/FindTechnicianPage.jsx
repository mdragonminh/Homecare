// fileName: FindTechnicianPage.jsx

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFindTechnician } from "../../../hooks/useFindTechnician.jsx";
import {
  Loader2,
  PlusCircle,
  Edit,
  MapPin,
  Search,
  Home,
  ChevronsDown,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Star,
  Globe,
  Check,
  ChevronDown,
  Wrench,
  Locate,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import MapDisplay from "../../../components/findTechnician/MapDisplay.jsx";
import AddHomeModal from "../home/AddHome.jsx";
import EditHomeModal from "../home/EditHomePage.jsx";
import TechnicianDetailModal from "../../../components/client/TechnicianDetailModal.jsx";

export function FindTechnicianPage({ loggedInUser }) {
  const { t } = useTranslation();
  const [technicianDetailModalVisible, setTechnicianDetailModalVisible] =
    useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState(null);

  const handleHomeAddedSuccess = () => {
    toast.success(t("success.home_added"));
    reloadHomeData();
    setIsAddHomeModalOpen(false);
  };

  const handleViewTechnicianDetails = (technicianId) => {
    setSelectedTechnicianId(technicianId);
    setTechnicianDetailModalVisible(true);
  };
  const {
    homes,
    selectedHomeId,
    // ĐÃ LOẠI BỎ: searchRadius,
    addressInput,
    coords,
    technicians,
    statusMessage,
    isLoading,
    isSearching,
    isAddHomeModalOpen,
    isEditHomeModalOpen,
    isGettingLocation,
    isServicesLoading,
    selectedServiceIds,
    isServiceDropdownOpen,
    isMatching,
    serviceSearchInput,
    currentHomeData,
    filteredServices,
    selectedServiceNames,
    preferredDate,
    preferredTime,
    // ĐÃ LOẠI BỎ: setSearchRadius,
    setAddressInput,
    setIsAddHomeModalOpen,
    setIsEditHomeModalOpen,
    setIsServiceDropdownOpen,
    setPreferredDate,
    setPreferredTime,
    handleAddressSelection,
    handleFindTechnician,
    handleCreateAndMatchBooking,
    handleGetMyLocation,
    handleServiceSearchInputChange,
    handleServiceSelection,
    reloadHomeData,
    handleMarkerDrag,
    handleGeocode,
    
  } = useFindTechnician(loggedInUser);

  const renderStatusMessage = (messageObj) => {
    if (!messageObj) return null;

    let message = "";
    let type = null;

    if (typeof messageObj === "string") {
      message = messageObj;
    } else if (typeof messageObj === "object") {
      message =
        typeof messageObj.text === "string"
          ? messageObj.text
          : JSON.stringify(messageObj.text ?? "");
      type = messageObj.type || null;
    }

    let icon, colorClass;

    if (type === "success") {
      icon = <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />;
      colorClass = "text-green-700 bg-green-50 border-green-200";
    } else if (type === "error") {
      icon = <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />;
      colorClass = "text-red-700 bg-red-50 border-red-200";
    } else if (type === "searching") {
      icon = <Loader2 className="h-5 w-5 mr-2 animate-spin flex-shrink-0" />;
      colorClass = "text-blue-700 bg-blue-50 border-blue-200";
    } else {
      icon = <MapPin className="h-5 w-5 mr-2 flex-shrink-0" />;
      colorClass = "text-gray-700 bg-gray-50 border-gray-200";
    }

    return (
      <div
        className={`flex items-center p-3 mt-4 text-sm border rounded-lg ${colorClass}`}
      >
        {icon}
        <span className="font-medium">{message}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center pt-24 min-h-screen">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-xl font-medium text-gray-700">
          {t("ui.loading_data")}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto pt-10 min-h-screen bg-gray-50">
      {/* Modals */}
      {loggedInUser && isAddHomeModalOpen && (
        <AddHomeModal
          onClose={() => setIsAddHomeModalOpen(false)}
          onSuccess={handleHomeAddedSuccess}
        />
      )}

      {loggedInUser && isEditHomeModalOpen && currentHomeData && (
        <EditHomeModal
          homeData={currentHomeData}
          onClose={() => setIsEditHomeModalOpen(false)}
          onSuccess={reloadHomeData}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Search className="h-7 w-7 text-blue-600" />
          {t("ui.search_technicians_title")}
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="lg:w-1/2 flex flex-col">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4 flex-1">
            {/* Section Title */}
            <div className="pb-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-600" />
                {t("ui.confirm_address_and_range")}
              </h2>
            </div>

            {/* Address Selection */}
            {loggedInUser && homes.length > 0 ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t("ui.select_service_address")}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedHomeId || ""}
                      onChange={handleAddressSelection}
                      className="flex-1 h-10 px-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                      disabled={isMatching}
                    >
                      <option value="" disabled>
                        {t("ui.select_service_needed")}
                      </option>
                      {homes.map((home) => (
                        <option key={home.id} value={home.id}>
                          {home.name} ({home.address.substring(0, 30)}...)
                        </option>
                      ))}
                    </select>

                    {currentHomeData && (
                      <button
                        onClick={() => setIsEditHomeModalOpen(true)}
                        className="w-10 h-10 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center"
                        title={t("ui.edit_address")}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setIsAddHomeModalOpen(true)}
                      className="w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center shadow-sm"
                      title={t("ui.add_new")}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </button>
                  </div>

                  {currentHomeData && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <Home className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>
                          <span className="font-semibold">
                            {currentHomeData.name}:
                          </span>{" "}
                          {currentHomeData.address}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : loggedInUser ? (
              <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <p className="text-gray-600 text-sm mb-3">
                  {t("ui.no_properties_found")}
                </p>
                <button
                  onClick={() => setIsAddHomeModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm flex items-center gap-1.5 mx-auto"
                >
                  <PlusCircle className="h-4 w-4" />
                  {t("ui.add_new")}
                </button>
              </div>
            ) : (
              <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <p className="text-gray-600 text-sm">
                  {t("ui.enter_address_to_search", {
                    defaultValue: "Vui lòng đăng nhập để sử dụng dịch vụ.",
                  })}
                </p>
              </div>
            )}

            {/* Service Selection */}
            <div className="relative">
              <label
                htmlFor="service-search-input"
                className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2"
              >
                <Wrench className="h-4 w-4 text-gray-600" />
                {t("ui.select_service_label", {
                  defaultValue: "Tìm kiếm hoặc Chọn Dịch vụ",
                })}
              </label>
              <div className="relative">
                <input
                  id="service-search-input"
                  type="text"
                  placeholder={t("ui.search_service_placeholder", {
                    defaultValue: "Gõ tên dịch vụ...",
                  })}
                  value={serviceSearchInput}
                  onChange={handleServiceSearchInputChange}
                  onFocus={() => setIsServiceDropdownOpen(true)}
                  onBlur={() =>
                    setTimeout(() => setIsServiceDropdownOpen(false), 200)
                  }
                  className="w-full h-10 px-3 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isSearching || isServicesLoading || isMatching}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  {isServicesLoading ? (
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>

              {selectedServiceIds.length > 0 && (
                <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedServiceNames.map((name, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center text-xs px-2.5 py-1 bg-blue-600 text-white rounded-md"
                      >
                        {name}
                        <button
                          onClick={() =>
                            handleServiceSelection(selectedServiceIds[index])
                          }
                          className="ml-1.5 hover:text-blue-100"
                          title={t("ui.clear_selection", {
                            defaultValue: "Xóa lựa chọn",
                          })}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isServiceDropdownOpen && !isServicesLoading && (
                <ul className="absolute z-20 w-full bg-white border border-gray-300 mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredServices.map((service) => {
                    const isSelected = selectedServiceIds.includes(service.id);
                    return (
                      <li
                        key={service.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleServiceSelection(service.id);
                        }}
                        className={`p-2.5 text-sm cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                          isSelected
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-800"
                        }`}
                      >
                        {service.name}
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </li>
                    );
                  })}
                  {filteredServices.length === 0 && serviceSearchInput && (
                    <li className="p-2.5 text-gray-500 text-sm text-center">
                      {t("ui.no_results_found", {
                        defaultValue: "Không tìm thấy kết quả",
                      })}
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* Date/Time (ĐÃ BỎ Ô BÁN KÍNH) */}
            <div
              className={`grid gap-3 ${
                loggedInUser ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
              }`}
            >
              {loggedInUser && (
                <div>
                  <label
                    htmlFor="preferred-date"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    {t("ui.preferred_date_label")}
                  </label>
                  <input
                    id="preferred-date"
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={isSearching || isMatching}
                  />
                </div>
              )}

              {loggedInUser && (
                <div>
                  <label
                    htmlFor="preferred-time"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    {t("ui.preferred_time_label")}
                  </label>
                  <input
                    id="preferred-time"
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={isSearching || isMatching}
                  />
                </div>
              )}
              
              {/* VỊ TRÍ CỦA INPUT BÁN KÍNH ĐÃ BỊ XÓA BỎ */}
            </div>
            
            {!loggedInUser && (
              <div>
                <label
                  htmlFor="address-input"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  {t("ui.manual_address_label")}
                </label>
                <input
                  id="address-input"
                  type="text"
                  placeholder={t("form.placeholder.address")}
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  onBlur={handleGeocode}
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isSearching || isGettingLocation || isMatching}
                />
              </div>
            )}
            {renderStatusMessage(statusMessage)}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 items-center sm:items-stretch">
              <button
                onClick={handleFindTechnician}
                disabled={isSearching || isMatching}
                className="w-11/12 max-w-md sm:flex-1 h-11 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("ui.searching")}
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    {t("ui.find_technicians_button", { 
                      // Đã loại bỏ radius: searchRadius 
                    })} 
                    {t("ui.find_technicians_button_default", {
                      defaultValue: ""
                    })}
                  </>
                )}
              </button>

              {loggedInUser && (
                <button
                  onClick={handleCreateAndMatchBooking}
                  disabled={isMatching || isSearching}
                  className="w-11/12 max-w-md sm:flex-1 h-11 bg-green-600 text-white font-medium text-sm rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  {isMatching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("ui.matching", { defaultValue: "Đang ghép nối..." })}
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {t("ui.match_technician_button", {
                        defaultValue: "Yêu cầu & Ghép nối Ngay",
                      })}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="lg:w-1/2 flex relative lg:min-h-[450px]">
          <div className="w-full h-full rounded-xl shadow-lg">
            {" "}
            <div className="w-full h-full rounded-[10px] overflow-hidden relative">
              <MapDisplay
                lat={coords.latitude}
                lng={coords.longitude}
                technicians={technicians}
                isDraggable={!loggedInUser}
                onMarkerDragEnd={handleMarkerDrag}
              />
              {!loggedInUser && (
                <button
                  onClick={handleGetMyLocation}
                  disabled={isSearching || isGettingLocation || isMatching}
                  className={`absolute bottom-4 left-4 z-10 w-10 h-10 rounded-lg bg-white shadow-md hover:shadow-lg transition-all flex items-center justify-center border border-gray-200 ${
                    isGettingLocation ? "animate-pulse" : "hover:bg-gray-50"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={t("ui.use_my_current_location", {
                    defaultValue: "Sử dụng Vị trí Hiện tại của tôi",
                  })}
                >
                  {isGettingLocation ? (
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  ) : (
                    <Locate className="h-5 w-5 text-gray-700" strokeWidth={2} />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 overflow-y-auto">
        <div className="pb-3 border-b border-gray-200 mb-4">
          <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
            <ChevronsDown className="h-5 w-5 text-gray-600" />
            {t("ui.technicians_list_title", {
              count: technicians ? technicians.length : 0,
            })}
          </h3>
        </div>

        {isSearching && (
          <p className="text-center text-blue-600 flex items-center justify-center p-4 text-sm">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t("ui.loading_data")}
          </p>
        )}

        {technicians && technicians.length === 0 && !isSearching && (
          <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <XCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium text-sm">
              {t("ui.no_technicians_found")}
            </p>
          </div>
        )}

        {technicians && technicians.length > 0 && (
          <ul className="space-y-3">
            {technicians.map((tech, index) => (
              <li
                key={tech.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto mb-2 sm:mb-0">
                  <span
                    className={`text-lg font-bold w-6 text-center ${
                      index < 3 ? "text-blue-600" : "text-gray-400"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">
                      {tech.name}
                    </p>
                    <div className="flex items-center text-xs text-gray-600 mt-1 gap-2">
                      <div className="flex items-center">
                        <Star
                          className="h-3.5 w-3.5 text-yellow-500 mr-0.5"
                          fill="currentColor"
                        />
                        <span className="font-medium">
                          {tech.ratingCount > 0 ? (
                            `${tech.rating}/5 (${tech.ratingCount} ${t(
                              "technicians.reviews"
                            )})`
                          ) : (
                            <span className="text-gray-400 italic">
                              {t("technicians.no_reviews")}
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="text-blue-600 font-semibold">
                        • {tech.distance} {t("ui.search_radius_unit")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleViewTechnicianDetails(tech.id)}
                    className="text-sm px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all shadow-sm flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    {t("ui.view_details", { defaultValue: "Xem chi tiết" })}
                  </button>
                  {/* <button className="text-sm px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm flex-1 sm:flex-initial">
                    {t("ui.select_technician")}
                  </button> */}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Technician Detail Modal */}
      <TechnicianDetailModal
        visible={technicianDetailModalVisible}
        onClose={() => setTechnicianDetailModalVisible(false)}
        technicianId={selectedTechnicianId}
      />

      {/* Matching Overlay */}
      {isMatching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Hiệu ứng mờ tối (Dimmed) */}
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300"></div>{" "}
          
          <div className="relative bg-white px-8 py-6 rounded-xl shadow-2xl border border-gray-200 flex flex-col items-center gap-4 animate-fadeIn">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            <p className="text-base font-semibold text-gray-800">
              {t("ui.matching_technician_process", {
                defaultValue: "Đang ghép nối kỹ thuật viên...",
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}