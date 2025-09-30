import { useState, useEffect, useRef } from "react";
import { X, Save, MapPin, Home, Navigation, Loader2, AlertCircle, Check, Compass } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { homeApi } from "../../../services/homeApi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Khởi tạo icon marker tùy chỉnh (Giữ nguyên)
const customMarkerIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = customMarkerIcon;

export default function AddAddressPage({ onClose, onSuccess }) {
  const { t } = useTranslation();
  
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const addressInputRef = useRef(null);
  const [isMapInit, setIsMapInit] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: 21.0285,
    longitude: 105.8542,
    customerProfileId: localStorage.getItem("userId") || "",
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // --- Initial Checks ---
  useEffect(() => {
    if (!localStorage.getItem("userId")) {
      // ✅ Dịch thông báo lỗi
      toast.error(t("address.error.user_not_found")); 
    }
  }, [t]); // Thêm 't' vào dependency array

  // --- Update Form & Clear Error ---
  const updateForm = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // --- Validate Form ---
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim() === "") {
      // ✅ Dịch lỗi tên
      newErrors.name = t("address.error.name_required");
    } else if (formData.name.trim().length < 3) {
      // ✅ Dịch lỗi tên
      newErrors.name = t("address.error.name_min_length");
    } else if (formData.name.length > 100) {
      // ✅ Dịch lỗi tên
      newErrors.name = t("address.error.name_max_length");
    }

    if (!formData.address || formData.address.trim() === "") {
      // ✅ Dịch lỗi địa chỉ
      newErrors.address = t("address.error.address_required");
    } else if (formData.address.trim().length < 10) {
      // ✅ Dịch lỗi địa chỉ
      newErrors.address = t("address.error.address_invalid");
    }

    if (!formData.latitude || !formData.longitude) {
      // ✅ Dịch lỗi bản đồ
      newErrors.map = t("address.error.map_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Initialize Map (Không thay đổi) ---
  useEffect(() => {
    if (!mapRef.current || isMapInit) return;

    mapInstance.current = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([formData.latitude, formData.longitude], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      className: "map-tiles",
    }).addTo(mapInstance.current);

    markerInstance.current = L.marker([formData.latitude, formData.longitude], {
      draggable: true,
      icon: customMarkerIcon,
    }).addTo(mapInstance.current);

    markerInstance.current.on("dragend", async (e) => {
      const pos = e.target.getLatLng();
      updateForm("latitude", pos.lat);
      updateForm("longitude", pos.lng);

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`
        );
        const data = await res.json();
        if (data?.display_name) {
          updateForm("address", data.display_name);
        }
      } catch (error) {
        console.error("Reverse geocoding error:", error);
      }
    });

    setIsMapInit(true);

    return () => {
      mapInstance.current?.remove();
    };
  }, []); 

  // --- Google Autocomplete ---
  useEffect(() => {
    if (!addressInputRef.current || !window.google?.maps || !isMapInit) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      addressInputRef.current,
      {
        types: ["geocode"],
        componentRestrictions: { country: ["vn"] },
      }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) {
        // ✅ Dịch thông báo lỗi
        toast.error(t("address.error.place_not_found"));
        return;
      }
      const newLat = place.geometry.location.lat();
      const newLng = place.geometry.location.lng();
      const newAddress = place.formatted_address;

      setFormData((prev) => ({
        ...prev,
        address: newAddress,
        latitude: newLat,
        longitude: newLng,
      }));

      markerInstance.current.setLatLng([newLat, newLng]);
      mapInstance.current.setView([newLat, newLng], 16);
    });
  }, [isMapInit, t]); // Thêm 't' vào dependency array

  // Update marker when state changes (initial set or autocomplete)
  useEffect(() => {
    if (mapInstance.current && markerInstance.current && isMapInit) {
      markerInstance.current.setLatLng([formData.latitude, formData.longitude]);
    }
  }, [formData.latitude, formData.longitude, isMapInit]);


  // --- Handle Save ---
  const handleSave = async () => {
    if (!validateForm()) {
      // ✅ Dịch thông báo lỗi
      toast.error(t("address.error.validation_failed")); 
      return;
    }
    if (isSaving) return;
    
    setIsSaving(true);

    try {
      const res = await homeApi.createHome(formData);
      if (res.success) {
        onSuccess(); 
        onClose();
      } else {
        // ✅ Dịch thông báo lỗi
        toast.error(res.message || t("address.error.save_failed"));
      }
    } catch (error) {
      console.error("Error creating home:", error);
      // ✅ Dịch thông báo lỗi
      toast.error(t("address.error.unexpected"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-6xl max-h-[95vh] bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header - ĐÃ SỬA MÀU SANG XANH DƯƠNG */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
        {/* BẢN GỐC: <div className="relative bg-gradient-to-r from-cyan-600 via-teal-600 to-green-600 px-8 py-6"> */}
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  {t("address.title.add_new")} {/* ✅ Dịch */}
                </h1>
                <p className="text-indigo-100 text-sm"> 
                {/* ĐÃ SỬA MÀU CHỮ: text-cyan-100 -> text-indigo-100 */}
                  {t("address.subtitle.fill_map")} {/* ✅ Dịch */}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white transition-all duration-200 hover:scale-105"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-120px)]">
          
          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            
            {/* Left Panel - Form */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Name Field */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t("address.field.name_label")} {/* ✅ Dịch */}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    className={`w-full px-4 py-4 border-2 rounded-2xl bg-slate-50/50 transition-all duration-300 focus:outline-none focus:bg-white ${
                      errors.name 
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10' 
                        /* ĐÃ SỬA MÀU FOCUS: focus:border-green-500 -> focus:border-indigo-500 */
                    }`}
                    placeholder={t("address.field.name_placeholder")} 
                  />
                  {!errors.name && formData.name.trim().length >= 3 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                </div>
                {errors.name && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>

              {/* Address Field */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t("address.field.address_label")} {/* ✅ Dịch */}
                </label>
                <div className="relative">
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateForm('address', e.target.value)}
                    className={`w-full pl-4 pr-12 py-4 border-2 rounded-2xl bg-slate-50/50 transition-all duration-300 focus:outline-none focus:bg-white ${
                      errors.address 
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                        /* ĐÃ SỬA MÀU FOCUS: focus:border-green-500 -> focus:border-indigo-500 */
                    }`}
                    placeholder={t("address.field.address_placeholder")} 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Navigation className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
                {errors.address && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errors.address}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-4">
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-19 py-3 text-slate-600 font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  {t("ui.cancel")} {/* ✅ Dịch */}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-10 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3 hover:scale-105 disabled:hover:scale-100"
                  /* ĐÃ SỬA MÀU NÚT: from-teal-600 to-green-600 -> from-blue-600 to-indigo-700 */
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t("ui.saving")}</span> {/* ✅ Dịch */}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>{t("ui.save_address")}</span> {/* ✅ Dịch */}
                    </>
                  )}
                </button>
              </div>

              {/* Help Box (Màu Xanh Dương) */}
              <div className="mt-15 bg-gradient-to-r from-indigo-50 to-indigo-50 border border-indigo-200 rounded-2xl p-5">
              {/* ĐÃ SỬA MÀU NỀN VÀ VIỀN: from-teal-50 to-green-50 / border-teal-200 -> from-indigo-50 to-indigo-50 / border-indigo-200 */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  {/* ĐÃ SỬA MÀU ICON BG & TEXT: bg-teal-100 / text-teal-600 -> bg-indigo-100 / text-indigo-600 */}
                    <Compass className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-indigo-900 mb-2">
                    {/* ĐÃ SỬA MÀU TEXT: text-teal-900 -> text-indigo-900 */}
                      {t("address.map_guide.title")} {/* ✅ Dịch */}
                    </h4>
                    <ul className="text-indigo-700 text-sm space-y-1 leading-relaxed">
                    {/* ĐÃ SỬA MÀU TEXT: text-teal-700 -> text-indigo-700 */}
                      <li>• {t("address.map_guide.tip1")}</li> {/* ✅ Dịch */}
                      <li>• {t("address.map_guide.tip2")}</li> {/* ✅ Dịch */}
                      <li>• {t("address.map_guide.tip3")}</li> {/* ✅ Dịch */}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Map */}
            <div className="xl:col-span-3 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">
                  {t("address.map.location_label")} {/* ✅ Dịch */}
                </label>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>{t("address.map.drag_tip")}</span> {/* ✅ Dịch */}
                </div>
              </div>
              
              <div className="relative">
                <div 
                  ref={mapRef}
                  className="h-[500px] w-full rounded-2xl border-2 border-slate-200 overflow-hidden shadow-xl bg-slate-100"
                  style={{ minHeight: '500px' }}
                />
              </div>
              {errors.map && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errors.map}</span>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}