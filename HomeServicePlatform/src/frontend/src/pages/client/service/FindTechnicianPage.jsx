// fileName: FindTechnicianPage.jsx

import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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
  CalendarClock,
  UserRound,
  ListChecks,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import MapDisplay from "../../../components/findTechnician/MapDisplay.jsx";
import AddHomeModal from "../home/AddHome.jsx";
import EditHomeModal from "../home/EditHomePage.jsx";
import TechnicianDetailModal from "../../../components/client/TechnicianDetailModal.jsx";
import { CustomDatePicker } from "../../../components/common/CustomDatePicker";
import { CustomTimePicker } from "../../../components/common/CustomTimePicker";
import { CustomAddressDropdown } from "../../../components/common/CustomAddressDropdown";
const PrimaryButton = ({
  children,
  onClick,
  disabled,
  className = "",
  icon: Icon,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    // Giữ nguyên màu blue, thêm hiệu ứng bóng mạnh hơn
    className={`w-full h-12 bg-blue-600 text-white font-semibold text-base rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:shadow-blue-500/50 ${className}`}
  >
    {Icon && <Icon className={`h-5 w-5 ${disabled ? "animate-spin" : ""}`} />}
    {children}
  </button>
);

const SuccessButton = ({
  children,
  onClick,
  disabled,
  className = "",
  icon: Icon,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    // Đã sửa bg-green-600 thành bg-cyan-600 để đồng bộ với theme Login
    className={`w-full h-12 bg-cyan-600 text-white font-semibold text-base rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:shadow-cyan-500/50 ${className}`}
  >
    {Icon && <Icon className={`h-5 w-5 ${disabled ? "animate-spin" : ""}`} />}
    {children}
  </button>
);
const InputField = ({ children, label, id }) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 mb-2"
    >
      {label}
    </label>
    {children}
  </div>
);
export function FindTechnicianPage({ loggedInUser }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
    matchSuccessInfo,
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
    setMatchSuccessInfo,
  } = useFindTechnician(loggedInUser);

  const appointmentLabel = useMemo(() => {
    if (!matchSuccessInfo?.scheduledAt) return null;
    const date = new Date(matchSuccessInfo.scheduledAt);
    if (Number.isNaN(date.getTime())) return matchSuccessInfo.scheduledAt;
    return date.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour12: false,
    });
  }, [matchSuccessInfo]);

  const handleCloseMatchModal = () => setMatchSuccessInfo(null);
  const handleViewBooking = () => {
    if (!matchSuccessInfo?.bookingId) {
      handleCloseMatchModal();
      return;
    }
    navigate(`/my-bookings/${matchSuccessInfo.bookingId}`);
    setMatchSuccessInfo(null);
  };

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

    let icon, colorClass, ringClass;

    if (type === "success") {
      icon = <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />;
      colorClass = "text-green-800 bg-green-100 border-green-300";
      ringClass = "ring-green-400";
    } else if (type === "error") {
      icon = <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />;
      colorClass = "text-red-800 bg-red-100 border-red-300";
      ringClass = "ring-red-400";
    } else if (type === "searching") {
      icon = <Loader2 className="h-5 w-5 mr-2 animate-spin flex-shrink-0" />;
      colorClass = "text-blue-800 bg-blue-100 border-blue-300";
      ringClass = "ring-blue-400";
    } else {
      icon = <MapPin className="h-5 w-5 mr-2 flex-shrink-0" />;
      colorClass = "text-gray-800 bg-gray-100 border-gray-300";
      ringClass = "ring-gray-400";
    }

    return (
      <div
        className={`flex items-center p-4 mt-4 text-sm border-2 rounded-xl ${colorClass} transition-all duration-300 ring-1 ${ringClass}`}
      >
        {icon}
        <span className="font-medium">{message}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center pt-24 min-h-screen bg-white">
        <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-6" />
        <p className="text-xl font-medium text-gray-700">
          {t("ui.loading_data")}
        </p>
      </div>
    );
  }

  return (
    // START: CONTAINER MỚI BAO PHỦ TOÀN BỘ TRANG VỚI BACKGROUND VÀ ANIMATION
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 relative overflow-hidden">
      
      {/* START: Animated Background Circles (Đã thêm hiệu ứng nền như trang Login) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Vòng tròn 1 */}
        <div 
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full blur-3xl opacity-30 animate-pulse-slow" 
        /> 
        {/* Vòng tròn 2 */}
        <div 
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-cyan-400 to-blue-400 rounded-full blur-3xl opacity-20 animate-pulse-slow-delay" 
        />
      </div>
      {/* END: Animated Background Circles */}
      
      {/* CONTAINER NỘI DUNG (Đã xóa class background và thêm z-10) */}
      <div className="p-4 md:p-8 max-w-screen-2xl mx-auto pt-10 relative z-10">

       
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            {/* Đã sửa màu icon Search từ blue-600 thành cyan-600 */}
            <Search className="h-8 w-8 text-cyan-600" />
            {t("ui.search_technicians_title")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("ui.search_technicians_subtitle", {
              defaultValue:
                "Tìm kiếm kỹ thuật viên phù hợp cho ngôi nhà của bạn.",
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Cột Form/Control */}
          <div className="flex flex-col">
            {/* Đã sửa card, thêm backdrop-blur, tăng shadow và bo góc */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/50 shadow-2xl p-6 md:p-8 space-y-6 flex-1 relative z-10">
              {/* Section Title */}
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {/* Đã sửa màu icon MapPin từ indigo-500 thành blue-600 */}
                  <MapPin className="h-5 w-5 text-blue-600" />
                  {t("ui.confirm_address_and_range")}
                </h2>
              </div>

              {/* Address Selection */}
              {loggedInUser && homes.length > 0 ? (
                <InputField
                  label={t("ui.select_service_address")}
                  id="address-select"
                >
                  <div className="flex gap-3">
                    <CustomAddressDropdown
                      homes={homes}
                      selectedHomeId={selectedHomeId}
                      onChange={handleAddressSelection}
                      disabled={isMatching}
                      placeholder={t("ui.select_service_needed")}
                    />

                    {/* Đã sửa nút Edit: border và text color */}
                    <button
                      onClick={() => setIsEditHomeModalOpen(true)}
                      disabled={!currentHomeData}
                      className="w-12 h-12 bg-white border border-blue-300 text-blue-600 rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all flex items-center justify-center shadow-sm disabled:opacity-50 flex-shrink-0"
                      title={t("ui.edit_address")}
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    {/* Đã sửa nút Add: sử dụng gradient */}
                    <button
                      onClick={() => setIsAddHomeModalOpen(true)}
                      className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:opacity-90 transition-all flex items-center justify-center shadow-md hover:shadow-lg flex-shrink-0"
                      title={t("ui.add_new")}
                    >
                      <PlusCircle className="h-5 w-5" />
                    </button>
                  </div>

                  {currentHomeData && (
                    // Đã sửa Home Info Box: dùng blue-50 và blue-200
                    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start gap-3 text-sm text-gray-800">
                        {/* Đã sửa màu icon Home từ indigo-600 thành blue-600 */}
                        <Home className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">
                            {currentHomeData.name}:
                          </span>{" "}
                          {currentHomeData.address}
                        </div>
                      </div>
                    </div>
                  )}
                </InputField>
              ) : loggedInUser ? (
                // Đã sửa nút Add trong trạng thái No Properties: dùng gradient
                <div className="text-center p-8 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50">
                  <p className="text-gray-700 font-medium mb-4">
                    {t("ui.no_properties_found")}
                  </p>
                  <button
                    onClick={() => setIsAddHomeModalOpen(true)}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all shadow-md flex items-center gap-1.5 mx-auto"
                  >
                    <PlusCircle className="h-4 w-4" />
                    {t("ui.add_new")}
                  </button>
                </div>
              ) : (
                <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                  <p className="text-gray-600 text-base">
                    {t("ui.enter_address_to_search", {
                      defaultValue: "Vui lòng đăng nhập để sử dụng dịch vụ.",
                    })}
                  </p>
                </div>
              )}

              {/* Service Selection */}
              <InputField
                label={
                  <span className="flex items-center gap-2">
                    {/* Đã sửa màu icon Wrench từ indigo-500 thành blue-600 */}
                    <Wrench className="h-5 w-5 text-blue-600" />
                    {t("ui.select_service_label", {
                      defaultValue: "Tìm kiếm hoặc Chọn Dịch vụ",
                    })}
                  </span>
                }
                id="service-search-input"
              >
                <div className="relative">
                  {" "}
                  {/* Dòng 280: Đây là container relative */}
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
                    // Đã sửa focus ring và border color
                    className="w-full h-12 px-4 text-base border border-gray-300 rounded-xl transition-all focus:ring-4 focus:ring-cyan-200/50 focus:border-blue-600 pr-12"
                    disabled={isSearching || isServicesLoading || isMatching}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    {isServicesLoading ? (
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                  {isServiceDropdownOpen && !isServicesLoading && (
                    <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-xl shadow-2xl max-h-72 overflow-y-auto top-full mt-1">
                      {filteredServices.map((service) => {
                        const isSelected = selectedServiceIds.includes(
                          service.id
                        );
                        return (
                          <li
                            key={service.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleServiceSelection(service.id);
                            }}
                            className={`p-3 text-base cursor-pointer transition-colors flex items-center justify-between ${
                              // Đã sửa màu hover
                              isSelected
                                ? "bg-blue-100 text-blue-800 font-semibold hover:bg-blue-200"
                                : "text-gray-800 hover:bg-gray-50"
                            }`}
                          >
                            {service.name}
                            {isSelected && <Check className="h-5 w-5" />}
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
                </div>{" "}
                {/* Kết thúc div.relative */}
                {selectedServiceIds.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded-xl">
                    <div className="flex flex-wrap gap-2">
                      {selectedServiceNames.map((name, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center text-sm px-3 py-1.5 bg-blue-600 text-white rounded-full font-medium shadow-sm"
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
              </InputField>
              <div
                className={`grid gap-4 ${
                  loggedInUser ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                }`}
              >
                {loggedInUser && (
                  <InputField
                    label={t("ui.preferred_date_label")}
                    id="preferred-date"
                  >
                    <CustomDatePicker
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      minDate={new Date().toISOString().split("T")[0]}
                      disabled={isSearching || isMatching}
                    />
                  </InputField>
                )}

                {loggedInUser && (
                  <InputField
                    label={t("ui.preferred_time_label")}
                    id="preferred-time"
                  >
                    <CustomTimePicker
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      disabled={isSearching || isMatching}
                    />
                  </InputField>
                )}

                {/* VỊ TRÍ CỦA INPUT BÁN KÍNH ĐÃ BỊ XÓA BỎ */}
              </div>

              {!loggedInUser && (
                <InputField
                  label={t("ui.manual_address_label")}
                  id="address-input-manual"
                >
                  <input
                    id="address-input-manual"
                    type="text"
                    placeholder={t("form.placeholder.address")}
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    onBlur={handleGeocode}
                    // Đã sửa focus ring và border color
                    className="w-full h-12 px-4 text-base border border-gray-300 rounded-xl transition-all focus:ring-4 focus:ring-cyan-200/50 focus:border-blue-600"
                    disabled={isSearching || isGettingLocation || isMatching}
                  />
                </InputField>
              )}

              {renderStatusMessage(statusMessage)}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-3">
                <PrimaryButton
                  onClick={handleFindTechnician}
                  disabled={isSearching || isMatching}
                  icon={isSearching ? Loader2 : Search}
                  className={loggedInUser ? "sm:flex-1" : "sm:flex-1"}
                >
                  {isSearching
                    ? t("ui.searching")
                    : t("ui.find_technicians_button", {
                        defaultValue: "Tìm Kỹ Thuật Viên",
                      })}
                </PrimaryButton>

                {loggedInUser && (
                  <SuccessButton
                    onClick={handleCreateAndMatchBooking}
                    disabled={isMatching || isSearching}
                    icon={isMatching ? Loader2 : Check}
                    className="sm:flex-1"
                  >
                    {isMatching
                      ? t("ui.matching", { defaultValue: "Đang ghép nối..." })
                      : t("ui.match_technician_button", {
                          defaultValue: "Yêu cầu & Ghép nối Ngay",
                        })}
                  </SuccessButton>
                )}
              </div>
            </div>
          </div>

          {/* Cột Map Display */}
          <div className="relative lg:min-h-[550px] min-h-[300px]">
            {/* Đã sửa Map container */}
            <div className="w-full h-full rounded-3xl shadow-2xl overflow-hidden relative border border-white/50">
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
                  className={`absolute bottom-4 left-4 z-10 w-12 h-12 rounded-full bg-white shadow-xl hover:shadow-2xl transition-all flex items-center justify-center border border-gray-200 ${
                    isGettingLocation ? "animate-pulse" : "hover:bg-gray-100"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={t("ui.use_my_current_location", {
                    defaultValue: "Sử dụng Vị trí Hiện tại của tôi",
                  })}
                >
                  {isGettingLocation ? (
                    <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                  ) : (
                    // Đã sửa màu icon Locate từ indigo-700 thành blue-700
                    <Locate
                      className="h-6 w-6 text-blue-700"
                      strokeWidth={2.5}
                    />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Technician List */}
        {/* Đã sửa List container */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/50 shadow-2xl p-6 md:p-8 overflow-y-auto relative z-10">
          <div className="pb-4 border-b border-gray-100 mb-6">
            <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
              {/* Đã sửa màu icon ChevronsDown từ indigo-500 thành blue-600 */}
              <ChevronsDown className="h-5 w-5 text-blue-600" />
              {t("ui.technicians_list_title", {
                count: technicians ? technicians.length : 0,
              })}
            </h3>
          </div>

          {isSearching && (
            <p className="text-center text-blue-600 flex items-center justify-center p-6 text-base font-medium">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              {t("ui.loading_data")}
            </p>
          )}

          {technicians && technicians.length === 0 && !isSearching && (
            <div className="text-center p-10 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
              <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium text-base">
                {t("ui.no_technicians_found")}
              </p>
            </div>
          )}

          {technicians && technicians.length > 0 && (
            <ul className="space-y-4">
              {technicians.map((tech, index) => (
                <li
                  key={tech.id}
                  // Đã sửa hover colors từ indigo thành blue
                  className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer shadow-sm hover:shadow-md duration-300 group"
                >
                  <div className="flex items-center gap-4 w-full md:w-auto mb-3 md:mb-0">
                    <span
                      className={`text-xl font-extrabold w-8 text-center ${
                        // Đã sửa màu rank từ indigo-600 thành blue-600
                        index < 3 ? "text-blue-600" : "text-gray-400"
                      } transition-colors duration-300`}
                    >
                      {index + 1}
                    </span>
                    {/* Đã sửa màu background và border icon */}
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200 group-hover:bg-blue-200 transition-colors">
                      {/* Đã sửa màu icon UserRound từ indigo-600 thành blue-600 */}
                      <UserRound className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-base">
                        {tech.name}
                      </p>
                      <div className="flex flex-wrap items-center text-sm text-gray-600 mt-1 gap-x-4 gap-y-1">
                        <div className="flex items-center">
                          <Star
                            className="h-4 w-4 text-yellow-500 mr-1"
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
                        <span className="text-blue-600 font-bold flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-blue-500" />
                          {tech.distance} {t("ui.search_radius_unit")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto mt-2 md:mt-0">
                    <button
                      onClick={() => handleViewTechnicianDetails(tech.id)}
                      className="flex-1 md:flex-none text-sm px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      {t("ui.view_details", { defaultValue: "Xem chi tiết" })}
                    </button>
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

        {/* END: CONTAINER NỘI DUNG */}
      </div>
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

     
      {isMatching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />

          {/* POPUP ĐẸP */}
          <div className="relative z-10 w-96 bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden animate-scale-in">

            {/* Header đẹp */}
            {/* Đã sửa gradient header từ indigo-400 to blue-500 thành blue-600 to cyan-600 */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 text-center">
              <p className="text-white text-lg font-semibold tracking-wide">
                Đang tìm kiếm kỹ thuật viên
              </p>
            </div>

            {/* Nội dung animation */}
            <div className="relative w-full h-48 flex items-center justify-center">
              
              {/* KHÓI */}
              <div className="absolute top-1/2 left-28 -translate-y-1/2 z-0">
                <div className="w-5 h-5 bg-gray-400/60 rounded-full animate-smoke" />
                <div className="w-4 h-4 bg-gray-400/50 rounded-full animate-smoke-delay-500" />
                <div className="w-6 h-6 bg-gray-400/40 rounded-full animate-smoke-delay-1000" />
              </div>

              {/* XE */}
              <div className="absolute top-1/2 -translate-y-1/2 w-28 h-28 animate-motor-run-inside z-10">
                <img
                  src="/030505804ea0d.png"
                  className="w-full h-full object-contain animate-motor-vibrate"
                  alt="motor"
                />
              </div>
              {/* ĐƯỜNG BÊN DƯỚI XE */}
              <div className="absolute top-[160px] left-1/2 -translate-x-1/2 z-0">
                <div className="road-line">
                  <div className="road-glow-dot"></div>
                </div>
              </div>

            </div>

            {/* Footer text */}
            <div className="px-6 pb-6 text-center">
              <p className="text-gray-700 text-sm">
                Hệ thống đang tìm kỹ thuật viên gần vị trí của bạn…
              </p>
            </div>
          </div>
        </div>
      )}


      {/* Match Success Modal (Cần nằm ngoài container nội dung) */}
      {matchSuccessInfo && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm"></div>
          {/* Đã sửa border top từ green-500 thành cyan-500 */}
          <div className="relative z-50 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border-t-8 border-cyan-500 transform transition-all duration-500 scale-100 opacity-100">
            <div className="flex flex-col items-center text-center mb-6">
              {/* Đã sửa màu icon CheckCircle từ green-600 thành cyan-600 */}
              <CheckCircle className="h-12 w-12 text-cyan-600 mb-3" />
              <p className="text-xl font-extrabold text-gray-900">
                {t("success.match_booking_success", {
                  defaultValue: "Ghép nối thành công!",
                })}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {matchSuccessInfo.message ||
                  t("ui.view_booking_details_prompt", {
                    defaultValue:
                      "Kiểm tra chi tiết lịch hẹn của bạn trong phần Đặt lịch.",
                  })}
              </p>
            </div>

            <div className="space-y-4 rounded-xl bg-gray-50 p-4 border border-gray-100">
              <div className="flex items-start gap-3">
                {/* Đã sửa màu icon UserRound từ indigo-600 thành blue-600 */}
                <UserRound className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {t("technicians.name", { defaultValue: "Kỹ thuật viên" })}
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {matchSuccessInfo.technicianName ||
                      t("ui.updating", { defaultValue: "Đang cập nhật" })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                {/* Đã sửa màu icon ListChecks từ indigo-600 thành blue-600 */}
                <ListChecks className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {t("services.title", { defaultValue: "Dịch vụ" })}
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {matchSuccessInfo.services?.length
                      ? matchSuccessInfo.services.join(", ")
                      : t("ui.updating", { defaultValue: "Đang cập nhật" })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                {/* Đã sửa màu icon CalendarClock từ indigo-600 thành blue-600 */}
                <CalendarClock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {t("ui.appointment_time", {
                      defaultValue: "Thời gian hẹn",
                    })}
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {appointmentLabel ||
                      t("ui.soonest_time", { defaultValue: "Sớm nhất có thể" })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                {/* Đã sửa màu icon MapPin từ indigo-600 thành blue-600 */}
                <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {t("ui.address", { defaultValue: "Địa chỉ" })}
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {matchSuccessInfo.address ||
                      t("ui.updating", { defaultValue: "Đang cập nhật" })}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCloseMatchModal}
                className="flex-1 h-11 rounded-xl border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 transition shadow-sm"
              >
                {t("ui.view_later", { defaultValue: "Để sau" })}
              </button>
              <button
                onClick={handleViewBooking}
                // Đã sửa bg-blue-600 thành gradient
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 font-semibold text-white hover:opacity-90 transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {t("ui.go_to_booking", {
                  defaultValue: "Chi tiết Đặt lịch",
                })}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    {/* END: CONTAINER BAO PHỦ TOÀN BỘ TRANG */}
    </div>
  );
}