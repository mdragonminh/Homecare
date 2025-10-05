import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, Save, MapPin, Home, Navigation, Loader2, AlertCircle, Check } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { homeApi } from "../../../services/homeApi";
import { toast } from "sonner";

const customMarkerIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = customMarkerIcon;

export default function EditHomePage({ homeData, onClose, onSuccess }) {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: 21.0285,
    longitude: 105.8542,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const addressInputRef = useRef(null);
  const [isMapInit, setIsMapInit] = useState(false);

  // Load data from homeData
  useEffect(() => {
    if (homeData) {
      setFormData({
        name: homeData.name,
        address: homeData.address,
        latitude: homeData.latitude,
        longitude: homeData.longitude,
      });
    }
  }, [homeData]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || isMapInit || !homeData) return;
    const initialLat = homeData.latitude;
    const initialLng = homeData.longitude;

    mapInstance.current = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([initialLat, initialLng], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      className: "map-tiles",
    }).addTo(mapInstance.current);

    markerInstance.current = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: customMarkerIcon,
    }).addTo(mapInstance.current);

    markerInstance.current.on("dragend", async (e) => {
      const pos = e.target.getLatLng();
      setFormData((prev) => ({
        ...prev,
        latitude: pos.lat,
        longitude: pos.lng,
      }));

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`
        );
        const data = await res.json();
        if (data?.display_name) {
          setFormData((prev) => ({ ...prev, address: data.display_name }));
        }
      } catch (error) {
        console.error("Reverse geocoding error:", error);
      }
    });

    setIsMapInit(true);

    return () => {
      mapInstance.current?.remove();
    };
  }, [homeData]);

  // Google Autocomplete
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

      markerInstance.current.setLatLng([newLat, newLng]);
      mapInstance.current.setView([newLat, newLng], 16);
    });
  }, [isMapInit, t]);

  // Update marker when state changes
  useEffect(() => {
    if (mapInstance.current && markerInstance.current && isMapInit) {
      markerInstance.current.setLatLng([formData.latitude, formData.longitude]);
    }
  }, [formData.latitude, formData.longitude, isMapInit]);

  // Handle input change with validation
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name || formData.name.trim() === "") {
      newErrors.name = t("address.error.name_required");
    } else if (formData.name.length > 100) {
      newErrors.name = t("address.error.name_max_length");
    }

    if (!formData.address || formData.address.trim() === "") {
      newErrors.address = t("address.error.address_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const res = await homeApi.updateHome(homeData.id, formData);
      if (res.success) {
        toast.success(t("success.home_edited"));
        onSuccess();
      } else {
        toast.error(res.message || t("address.error.save_failed"));
      }
    } catch (error) {
      toast.error(t("error.try_again"));
      console.error("Update error:", error);
    } finally {
      setIsLoading(false);
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
        
        {/* Header - ĐÃ SỬA MÀU TẠI ĐÂY */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
        {/* BẢN GỐC: <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6"> */}
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  {t("ui.edit_address")}
                </h1>
                <p className="text-indigo-100 text-sm">
                  {t("address.subtitle.update_details")}
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
                  {t("address.field.name_label")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-4 border-2 rounded-2xl bg-slate-50/50 transition-all duration-300 focus:outline-none focus:bg-white ${
                      errors.name 
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                    }`}
                    placeholder={t("address.field.name_placeholder")}
                  />
                  {!errors.name && formData.name.trim() && (
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
                  {t("address.field.address_label")}
                </label>
                <div className="relative">
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={`w-full pl-4 pr-12 py-4 border-2 rounded-2xl bg-slate-50/50 transition-all duration-300 focus:outline-none focus:bg-white ${
                      errors.address 
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
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
                  className="px-19 py-3 text-slate-600 font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  {t("ui.cancel")}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  // ĐÃ SỬA MÀU NÚT: từ indigo-600/purple-600 sang blue-600/indigo-700
                  className="px-9 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3 hover:scale-105 disabled:hover:scale-100"
                >
                  {isLoading ? (
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
              </div>

              {/* Help Box */}
              {/* ĐÃ SỬA MÀU HELP BOX: từ indigo-50/purple-50 sang blue-50/blue-50 */}
              <div className="mt-15 bg-gradient-to-r from-blue-50 to-blue-50 border border-blue-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">
                      {t("address.map_guide.title")}
                    </h4>
                    <ul className="text-blue-700 text-sm space-y-1 leading-relaxed">
                      <li>• {t("address.map_guide.tip1")}</li>
                      <li>• {t("address.map_guide.tip2")}</li>
                      <li>• {t("address.map_guide.tip3")}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Map */}
            <div className="xl:col-span-3 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">
                  {t("address.map.location_label")}
                </label>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>{t("ui.active_status")}</span>
                </div>
              </div>
              
              <div className="relative">
                <div 
                  ref={mapRef}
                  className="h-[500px] w-full rounded-2xl border-2 border-slate-200 overflow-hidden shadow-xl bg-slate-100"
                  style={{ minHeight: '500px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}