import React from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import MapDisplay from "../../../components/findTechnician/MapDisplay.jsx";
import AddHomeModal from "../home/AddHome.jsx";
import EditHomeModal from "../home/EditHomePage.jsx";

// ---------------------------------------------------------------------
// 1. CUSTOM HOOK IMPORT & DESTRUCTURE
// ---------------------------------------------------------------------

export function FindTechnicianPage({ loggedInUser }) {
  const { t } = useTranslation();
  const handleHomeAddedSuccess = () => {
    toast.success(t("success.home_added"));
    reloadHomeData();
    setIsAddHomeModalOpen(false);
  };
  const {
    // State & Values
    homes,
    selectedHomeId,
    searchRadius,
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
    // Setters
    setSearchRadius,
    setAddressInput,
    setIsAddHomeModalOpen,
    setIsEditHomeModalOpen,
    setIsServiceDropdownOpen,
    setPreferredDate,
    setPreferredTime,

    // Handlers
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

  // ---------------------------------------------------------------------
  // 2. RENDER UTILITY FUNCTIONS (Giao diện)
  // ---------------------------------------------------------------------

  // Thay thế hàm renderStatusMessage cũ bằng hàm này:

  const renderStatusMessage = (messageObj) => {
    // Hỗ trợ cả string (cũ) và object (mới)
    const message =
      typeof messageObj === "string" ? messageObj : messageObj?.text || "";
    const type =
      typeof messageObj === "string" ? null : messageObj?.type || null;

    let icon, colorClass;

    if (type === "success") {
      icon = <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />;
      colorClass = "text-green-800 bg-green-100 border-green-300";
    } else if (type === "error") {
      icon = <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />;
      colorClass = "text-red-700 bg-red-100 border-red-300";
    } else if (type === "searching") {
      icon = <Loader2 className="h-5 w-5 mr-2 animate-spin flex-shrink-0" />;
      colorClass = "text-blue-700 bg-blue-100 border-blue-300";
    } else {
      icon = <MapPin className="h-5 w-5 mr-2 flex-shrink-0" />;
      colorClass = "text-gray-700 bg-gray-100 border-gray-300";
    }

    return (
      <div
        className={`flex items-center p-3 mt-4 text-base border rounded-xl transition-colors shadow-sm ${colorClass}`}
      >
        {icon}
        <span className="font-medium">{message}</span>
      </div>
    );
  };

  // ---------------------------------------------------------------------
  // 3. MAIN RENDER
  // ---------------------------------------------------------------------

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
    <div className="p-4 md:p-8 max-w-full lg:max-w-7xl xl:max-w-full mx-auto pt-10 min-h-screen bg-white">
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

      <h1 className="text-3xl md:text-4xl font-extrabold mb-8 text-gray-900 border-b-4 border-blue-500 pb-4">
        <Search className="inline-block h-7 w-7 text-blue-600 mr-2" />
        {t("ui.search_technicians_title")}
      </h1>

      <div className="flex flex-col lg:flex-row gap-6 mb-6 lg:items-stretch">
        {/* Cột Trái: Form nhập liệu */}
        <div className="lg:w-3/5 flex flex-col">
          <div className="p-6 border border-gray-200 rounded-2xl shadow-xl bg-white space-y-5 flex-1 flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 flex items-center border-b-2 border-blue-200 pb-3">
              <MapPin className="h-5 w-5 text-blue-600 mr-2" />
              {t("ui.confirm_address_and_range")}
            </h2>

            {/* Phần Chọn Địa chỉ Dịch vụ */}
            {loggedInUser && homes.length > 0 ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-1">
                    {t("ui.select_service_address")}
                  </label>
                  <div className="flex flex-wrap gap-2 items-stretch">
                    <select
                      value={selectedHomeId || ""}
                      onChange={handleAddressSelection}
                      className="flex-grow min-w-[200px] h-11 px-4 border-2 border-gray-300 rounded-xl bg-white text-gray-900 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer shadow-sm font-medium text-base"
                      disabled={isMatching}
                    >
                      <option value="" disabled>
                        {t("ui.select_service_needed")}
                      </option>
                      {homes.map((home) => (
                        <option key={home.id} value={home.id}>
                          {home.name} ({home.address.substring(0, 25)}...)
                        </option>
                      ))}
                    </select>

                    {currentHomeData && (
                      <button
                        onClick={() => setIsEditHomeModalOpen(true)}
                        className="w-11 h-11 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.05] transition-all active:scale-95 flex items-center justify-center flex-shrink-0"
                        title={t("ui.edit_address")}
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => setIsAddHomeModalOpen(true)}
                      className="w-11 h-11 bg-gradient-to-br from-green-500 to-green-700 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.05] transition-all active:scale-95 flex items-center justify-center flex-shrink-0"
                      title={t("ui.add_new")}
                    >
                      <PlusCircle className="h-5 w-5" />
                    </button>
                  </div>

                  {currentHomeData && (
                    <p className="mt-3 text-base text-blue-900 flex items-start gap-2 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl shadow-sm">
                      <Home className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" />
                      <span>
                        <span className="font-bold">
                          {currentHomeData.name}:
                        </span>{" "}
                        {currentHomeData.address}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            ) : loggedInUser ? (
              // Người dùng đã đăng nhập nhưng chưa có nhà
              <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                <p className="text-gray-600 font-medium mb-4 text-base">
                  {statusMessage || t("ui.no_properties_found")}
                </p>
                <button
                  onClick={() => setIsAddHomeModalOpen(true)}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.05] transition-all active:scale-95 shadow-md flex items-center justify-center mx-auto text-base"
                >
                  <PlusCircle className="h-5 w-5 mr-1" />
                  {t("ui.add_new")}
                </button>
              </div>
            ) : (
              // Chưa đăng nhập
              <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                <p className="text-gray-600 font-medium mb-4 text-base">
                  {t("ui.enter_address_to_search", {
                    defaultValue: "Vui lòng nhập địa chỉ để tìm kiếm dịch vụ.",
                  })}
                </p>
              </div>
            )}

            {/* Phần Chọn Dịch vụ */}
            <div className="relative">
              <label
                htmlFor="service-search-input"
                className="block text-base font-semibold text-gray-800 mb-1 flex items-center"
              >
                <Wrench className="h-5 w-5 text-blue-600 mr-2" />
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
                  className="w-full h-11 p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base font-medium pr-10 shadow-sm hover:border-gray-400"
                  disabled={isSearching || isServicesLoading || isMatching}
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  {isServicesLoading ? (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </div>

              {selectedServiceIds.length > 0 && (
                <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 text-blue-900 rounded-xl shadow-sm">
                  <div className="flex flex-wrap gap-2">
                    {selectedServiceNames.map((name, index) => (
                      <span
                        key={index}
                        className="flex items-center text-sm px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-md hover:shadow-lg transition-all"
                      >
                        {name}
                        <button
                          onClick={() =>
                            handleServiceSelection(selectedServiceIds[index])
                          }
                          className="ml-2 hover:text-blue-100 transition-colors"
                          title={t("ui.clear_selection", {
                            defaultValue: "Xóa lựa chọn",
                          })}
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isServiceDropdownOpen && !isServicesLoading && (
                <ul className="absolute z-20 w-full bg-white border-2 border-gray-300 mt-1 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                  {filteredServices.map((service) => {
                    const isSelected = selectedServiceIds.includes(service.id);
                    return (
                      <li
                        key={service.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleServiceSelection(service.id);
                        }}
                        className={`p-3 cursor-pointer hover:bg-blue-50 flex items-center justify-between transition-colors text-base ${
                          isSelected
                            ? "bg-blue-100 text-blue-700 font-semibold"
                            : "text-gray-800"
                        }`}
                      >
                        {service.name}
                        {isSelected && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </li>
                    );
                  })}
                  {filteredServices.length === 0 && serviceSearchInput && (
                    <li className="p-3 text-gray-500 text-base text-center">
                      {t("ui.no_results_found", {
                        defaultValue: "Không tìm thấy kết quả",
                      })}
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* Phần Chọn Bán Kính */}
            <div
              className={`grid gap-4 mt-5 ${
                loggedInUser ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1"
              }`}
            >
              {/* 1. BÁN KÍNH – LUÔN HIỆN */}
              <div>
                <label
                  htmlFor="search-radius"
                  className="block text-base font-semibold text-gray-800 mb-1 flex items-center"
                >
                  <Globe className="h-5 w-5 text-blue-600 mr-2" />
                  {t("ui.search_radius_label")}
                </label>
                <div className="relative">
                  <input
                    id="search-radius"
                    type="number"
                    min="1"
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(e.target.value)}
                    className="w-full h-11 p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base font-medium pr-14 shadow-sm hover:border-gray-400"
                    placeholder={t("form.placeholder.search_radius")}
                    disabled={isSearching || isMatching}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                    {t("ui.search_radius_unit")}
                  </span>
                </div>
              </div>

              {/* 2. NGÀY – CHỈ HIỆN KHI LOGIN */}
              {loggedInUser && (
                <div>
                  <label
                    htmlFor="preferred-date"
                    className="block text-base font-semibold text-gray-800 mb-1 flex items-center"
                  >
                    {t("ui.preferred_date_label")}
                  </label>
                  <input
                    id="preferred-date"
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full h-11 p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base font-medium pr-3 shadow-sm hover:border-gray-400"
                    disabled={isSearching || isMatching}
                  />
                </div>
              )}

              {/* 3. GIỜ – CHỈ HIỆN KHI LOGIN */}
              {loggedInUser && (
                <div>
                  <label
                    htmlFor="preferred-time"
                    className="block text-base font-semibold text-gray-800 mb-1 flex items-center"
                  >
                    {t("ui.preferred_time_label")}
                  </label>
                  <input
                    id="preferred-time"
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full h-11 p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base font-medium pr-3 shadow-sm hover:border-gray-400"
                    disabled={isSearching || isMatching}
                  />
                </div>
              )}
            </div>

            {/* Phần Nhập Vị Trí Thủ Công (Chỉ hiện khi chưa chọn nhà) */}
            {!loggedInUser || (loggedInUser && !selectedHomeId) ? (
              <div className="relative space-y-2">
                <label className="block text-base font-semibold text-gray-800 mb-1">
                  {t("ui.manual_address_label")}
                </label>
                <input
                  id="address-input"
                  type="text"
                  placeholder={t("form.placeholder.address")}
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  onBlur={handleGeocode}
                  className="w-full h-11 p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-400 text-base"
                  disabled={isSearching || isGettingLocation || isMatching}
                />
              </div>
            ) : null}

            {renderStatusMessage(statusMessage)}

            {/* BỐ CỤC NÚT ĐÃ THAY ĐỔI */}
            <div className="flex gap-4 mt-5">
              {/* Nút Tìm Kiếm Kỹ Thuật Viên */}
              <button
                onClick={handleFindTechnician}
                disabled={isSearching || isMatching}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center active:scale-[0.99]"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-5 w-5 text-white mr-2 animate-spin" />
                    {t("ui.searching")}
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    {t("ui.find_technicians_button", { radius: searchRadius })}
                  </>
                )}
              </button>

              {/* Nút Yêu cầu & Ghép nối */}
              {loggedInUser && (
                <button
                  onClick={handleCreateAndMatchBooking}
                  disabled={isMatching || isSearching}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center active:scale-[0.99]"
                >
                  {isMatching ? (
                    <>
                      <Loader2 className="h-5 w-5 text-white mr-2 animate-spin" />
                      {t("ui.matching", { defaultValue: "Đang ghép nối..." })}
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      {t("ui.match_technician_button", {
                        defaultValue: "Yêu cầu & Ghép nối Ngay",
                      })}
                    </>
                  )}
                </button>
              )}
            </div>
            {/* KẾT THÚC BỐ CỤC NÚT ĐÃ THAY ĐỔI */}
          </div>
        </div>

        {/* Cột Phải: Bản Đồ (Map) */}
        <div className="lg:w-2/5 flex relative min-h-[450px]">
          <MapDisplay
            lat={coords.latitude}
            lng={coords.longitude}
            technicians={technicians}
            isDraggable={!loggedInUser || (loggedInUser && !selectedHomeId)}
            onMarkerDrag={handleMarkerDrag}
          />

          {/* Nút Floating Action Button cho Vị trí Hiện tại */}
          {!loggedInUser || (loggedInUser && !selectedHomeId) ? (
            <button
              onClick={handleGetMyLocation}
              disabled={isSearching || isGettingLocation || isMatching}
              className={`absolute bottom-4 right-4 z-10 w-12 h-12 rounded-full shadow-2xl transition-all flex items-center justify-center ${
                isGettingLocation
                  ? "bg-blue-500 animate-pulse disabled:opacity-100"
                  : "bg-red-500 hover:bg-red-600 hover:scale-105 active:scale-95"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={t("ui.use_my_current_location", {
                defaultValue: "Sử dụng Vị trí Hiện tại của tôi",
              })}
            >
              {isGettingLocation ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Locate className="h-6 w-6 text-white" />
              )}
            </button>
          ) : null}
        </div>
      </div>

      {/* Danh sách Kỹ thuật viên */}
      <div className="p-6 border-2 border-gray-200 rounded-2xl bg-white shadow-xl max-h-[500px] overflow-y-auto mt-6">
        <h3 className="font-bold text-xl md:text-2xl mb-5 text-gray-900 flex items-center border-b-2 border-red-300 pb-3">
          <ChevronsDown className="h-6 w-6 text-red-600 mr-2" />
          {t("ui.technicians_list_title", {
            count: technicians ? technicians.length : 0,
          })}
        </h3>

        {isSearching && (
          <p className="text-center text-blue-600 flex items-center justify-center p-4 font-medium text-lg">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            {t("ui.loading_data")}
          </p>
        )}

        {technicians && technicians.length === 0 && !isSearching && (
          <div className="text-center p-8 border-2 border-dashed border-red-300 rounded-xl bg-red-50">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold text-lg">
              {t("ui.no_technicians_found", { radius: searchRadius })}
            </p>
          </div>
        )}

        {technicians && technicians.length > 0 && (
          <ul className="space-y-4">
            {technicians.map((tech, index) => (
              <li
                key={tech.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center mb-3 sm:mb-0 w-full sm:w-auto">
                  <span
                    className={`text-2xl font-extrabold mr-3 w-8 text-center ${
                      index < 3 ? "text-red-600" : "text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mr-3 border-2 border-red-400 shadow-md">
                    <MapPin className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-bold text-gray-900 text-base">
                      {tech.name}
                    </p>
                    <div className="flex items-center text-base text-gray-600 mt-1.5 gap-2">
                      <div className="flex items-center">
                        <Star
                          className="h-4 w-4 text-yellow-500 mr-1"
                          fill="currentColor"
                        />
                        <span className="font-semibold">
                          {tech.rating || t("ui.not_updated")}
                        </span>
                      </div>
                      <span className="text-red-700 font-bold">
                        • {tech.distance} {t("ui.search_radius_unit")}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="text-base px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:shadow-xl hover:scale-105 transition-all active:scale-95 shadow-lg w-full sm:w-auto mt-2 sm:mt-0">
                  {t("ui.select_technician")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Overlay: CHỈ LÀM MỜ + SPINNER NHẸ – KHÔNG CHE GÌ HẾT */}
      {isMatching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          {/* Chỉ blur nền, không có màu nền */}
          <div className="absolute inset-0 backdrop-blur-sm"></div>

          {/* Spinner + thông báo nổi nhẹ ở giữa */}
          <div className="relative bg-white bg-opacity-80 px-8 py-6 rounded-2xl shadow-xl border border-gray-200 flex flex-col items-center space-y-3 animate-pulse">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            <p className="text-lg font-semibold text-gray-800 whitespace-nowrap">
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
