import { useState, useEffect, useRef } from "react";
import {
  X,
  Save,
  Loader2,
  AlertCircle,
  Check,
  Compass,
  Locate,
  Navigation,
  Home,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { homeApi } from "../../../services/homeApi";

// Lấy API Key từ biến môi trường
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function AddAddressPage({ onClose, onSuccess }) {
  const { t } = useTranslation();

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const addressInputRef = useRef(null);
  const [isMapInit, setIsMapInit] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: 21.0285, // Mặc định Hà Nội
    longitude: 105.8542,
    customerProfileId: localStorage.getItem("userId") || "",
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const updateForm = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim() === "") {
      newErrors.name = t("address.error.name_required");
    } else if (formData.name.trim().length < 3) {
      newErrors.name = t("address.error.name_min_length");
    } else if (formData.name.length > 100) {
      newErrors.name = t("address.error.name_max_length");
    }

    if (!formData.address || formData.address.trim() === "") {
      newErrors.address = t("address.error.address_required");
    } else if (formData.address.trim().length < 10) {
      newErrors.address = t("address.error.address_invalid");
    }

    if (!formData.latitude || !formData.longitude) {
      newErrors.map = t("address.error.map_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Các useEffects (Giữ nguyên logic) ---

  useEffect(() => {
    if (!localStorage.getItem("userId")) {
      toast.error(t("address.error.user_not_found"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || isMapInit || !window.google?.maps) return;

    const { latitude, longitude } = formData;
    const initialLocation = { lat: latitude, lng: longitude };

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: initialLocation,
      zoom: 16,
      mapTypeId: "roadmap",
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
    });

    markerInstance.current = new window.google.maps.Marker({
      position: initialLocation,
      map: mapInstance.current,
      draggable: true,
    });

    markerInstance.current.addListener("dragend", async () => {
      const pos = markerInstance.current.getPosition();
      const newLat = pos.lat();
      const newLng = pos.lng();
      updateForm("latitude", newLat);
      updateForm("longitude", newLng);

      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${newLat},${newLng}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          updateForm("address", data.results[0].formatted_address);
        }
      } catch (error) {
        console.error(error);
        // Handle error silently
      }
    });

    setIsMapInit(true);

    setTimeout(() => {
      window.google.maps.event.trigger(mapInstance.current, 'resize');
    }, 100);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      const newPos = new window.google.maps.LatLng(newLat, newLng);
      markerInstance.current.setPosition(newPos);
      mapInstance.current.setCenter(newPos);
      mapInstance.current.setZoom(16);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapInit, t]);

  useEffect(() => {
    if (mapInstance.current && markerInstance.current && isMapInit) {
      const newPos = new window.google.maps.LatLng(formData.latitude, formData.longitude);
      markerInstance.current.setPosition(newPos);
    }
  }, [formData.latitude, formData.longitude, isMapInit]);

  const handleGetMyLocation = () => {
    if (isGettingLocation) return;

    setIsGettingLocation(true);
    toast.info(t("ui.getting_current_location"));

    if (!navigator.geolocation) {
      toast.error(t("address.error.geolocation_not_supported"));
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        updateForm("latitude", latitude);
        updateForm("longitude", longitude);

        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
          );
          const data = await res.json();

          if (data.results && data.results.length > 0) {
            const newAddress = data.results[0].formatted_address;
            updateForm("address", newAddress);

            const newPos = new window.google.maps.LatLng(latitude, longitude);
            markerInstance.current.setPosition(newPos);
            mapInstance.current.setCenter(newPos);
            mapInstance.current.setZoom(16);

            toast.success(t("success.geocode_success"));
          } else {
            toast.error(t("address.error.geocode_failed"));
          }
        } catch (error) {
          console.error(error);
          toast.error(t("address.error.geocode_failed"));
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error(error);
        toast.error(t("address.error.geolocation_failed"));
        setIsGettingLocation(false);
      }
    );
  };

  const handleSave = async () => {
    if (!validateForm()) {
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
        toast.error(res.message || t("address.error.save_failed"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("address.error.unexpected"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80 backdrop-blur-sm transition-all duration-300"
        onClick={onClose}
      />
      <div className="relative w-full max-w-full sm:max-w-6xl **h-full sm:h-auto** max-h-full sm:max-h-[95vh] bg-white rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 px-4 sm:px-8 py-4 sm:py-6 flex-shrink-0">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center">
                <Home className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white mb-1">
                  {t("address.title.add_new")}
                </h1>
                <p className="text-indigo-100 text-sm hidden sm:block">
                  {t("address.subtitle.fill_map")}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center text-white transition-all duration-200 hover:scale-105"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Content - Bọc trong div flex-grow và overflow-y-auto */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-grow">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6">

            {/* Map Section (Order: 1) */}
            <div
              className="order-1 xl:col-span-3 space-y-3 sm:space-y-4 relative"
              style={{ position: "relative", minHeight: "350px", zIndex: 0 }}
            >
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">
                  {t("address.map.location_label")}
                </label>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>{t("address.map.drag_tip")}</span>
                </div>
              </div>

              <div className="relative">
                <div
                  ref={mapRef}
                  className="h-[300px] sm:h-[450px] w-full rounded-xl sm:rounded-2xl border-2 border-slate-200 overflow-hidden shadow-xl bg-slate-100"
                  style={{ minHeight: "300px", zIndex: 1 }}
                />

                <button
                  onClick={handleGetMyLocation}
                  disabled={isGettingLocation}
                  className={`absolute bottom-3 left-3 z-[1000] w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg transition-all flex items-center justify-center
                  ${
                    isGettingLocation
                      ? "bg-indigo-500 animate-pulse disabled:opacity-100 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-100 hover:scale-[1.02] active:scale-95 border border-slate-200"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={t("ui.use_my_current_location")}
                >
                  {isGettingLocation ? (
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                  ) : (
                    <Locate className="h-5 w-5 sm:h-6 sm:w-6" />
                  )}
                </button>
              </div>

              <div className="min-h-[20px] pt-1">
                {errors.map && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errors.map}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Form Section (Order: 2) */}
            <div className="order-2 xl:col-span-2 space-y-3 sm:space-y-4">

              {/* Name Field */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {t("address.field.name_label")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl bg-slate-50/50 transition-all duration-300 text-base focus:outline-none focus:bg-white ${
                      errors.name
                        ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                        : "border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    }`}
                    placeholder={t("address.field.name_placeholder")}
                  />
                  {!errors.name && formData.name.trim().length >= 3 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                </div>
                <div className="min-h-[20px] pt-1">
                  {errors.name && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errors.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Address Field */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {t("address.field.address_label")}
                </label>
                <div className="relative">
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateForm("address", e.target.value)}
                    className={`w-full pl-4 pr-12 py-3 border-2 rounded-xl bg-slate-50/50 transition-all duration-300 text-base focus:outline-none focus:bg-white ${
                      errors.address
                        ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                        : "border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    }`}
                    placeholder={t("address.field.address_placeholder")}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Navigation className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
                <div className="min-h-[20px] pt-1">
                  {errors.address && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errors.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons - ĐÃ ĐẢO VỊ TRÍ VÀ ĐẢM BẢO CHỮA RỘNG BẰNG NHAU */}
              <div className="flex flex-col sm:flex-row items-center justify-start gap-3 sm:gap-4 pt-2 sm:pt-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full sm:w-1/2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3 justify-center order-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t("ui.saving")}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>{t("ui.save_address")}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="w-full sm:w-1/2 px-6 py-3 text-slate-600 font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 order-2"
                >
                  <span>{t("ui.cancel")}</span>
                </button>

              </div>
              <div className="mt-4 sm:mt-6 bg-gradient-to-r from-indigo-50 to-indigo-50 border border-indigo-200 rounded-xl sm:rounded-2xl p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Compass className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-indigo-900 mb-1 sm:mb-2 text-base">
                      {t("address.map_guide.title")}
                    </h4>
                    <ul className="text-indigo-700 text-sm space-y-1 leading-relaxed">
                      <li>• {t("address.map_guide.tip1")}</li>
                      <li>• {t("address.map_guide.tip2")}</li>
                      <li>• {t("address.map_guide.tip3")}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}