import { useState, useEffect, useRef } from "react";
import { MapPin, ArrowLeft, Check, Compass, Map } from "lucide-react";
import { toast } from "react-toastify";
import { homeApi } from "../../../services/homeApi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

export default function AddAddressPage({ onClose }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const addressInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: 21.0285,
    longitude: 105.8542,
    customerProfileId: localStorage.getItem("userId") || "",
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("userId")) {
      toast.error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.", {
        position: "top-right",
      });
    }
  }, []);

  const updateForm = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Tên địa chỉ không được để trống";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Tên địa chỉ phải có ít nhất 3 ký tự";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Địa chỉ không được để trống";
    } else if (formData.address.trim().length < 10) {
      newErrors.address = "Địa chỉ quá ngắn, vui lòng nhập chi tiết hơn";
    }
    if (!formData.latitude || !formData.longitude) {
      newErrors.map = "Bạn chưa chọn vị trí trên bản đồ";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (!mapRef.current) return;

    mapInstance.current = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: false, // Tắt cuộn chuột để tránh xung đột
    }).setView([formData.latitude, formData.longitude], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapInstance.current);

    markerInstance.current = L.marker([formData.latitude, formData.longitude], {
      draggable: true,
      icon: customMarkerIcon,
    }).addTo(mapInstance.current);

    markerInstance.current.on("dragend", async (e) => {
      const pos = e.target.getLatLng();
      setFormData((prev) => ({ ...prev, latitude: pos.lat, longitude: pos.lng }));
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

    return () => {
      mapInstance.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!addressInputRef.current || !window.google?.maps) return;

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
        toast.error("Không tìm thấy địa chỉ hợp lệ.", { position: "top-right" });
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
  }, []);

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin nhập!", { position: "top-right" });
      return;
    }
    if (isSaving) return;
    setIsSaving(true);

    try {
      const res = await homeApi.createHome(formData);
      if (res.success) {
        toast.success("Đã lưu địa chỉ thành công!", {
          position: "top-right",
          autoClose: 2000,
        });
        onClose();
      } else {
        toast.error(res.message || "Có lỗi xảy ra khi lưu địa chỉ", {
          position: "top-right",
        });
      }
    } catch (error) {
      console.error("Error creating home:", error);
      toast.error("Có lỗi không mong muốn xảy ra", { position: "top-right" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-fit max-h-[90vh] bg-gradient-to-b from-blue-100 via-white to-blue-50 p-4 md:p-6 flex flex-col w-full overflow-hidden no-scrollbar">
      {/* Header */}
      <header className="bg-white rounded-2xl shadow-lg px-6 py-4 mb-4 flex items-center justify-between sticky top-0 z-50">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-700 transition-colors duration-300"
          disabled={isSaving}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold text-sm md:text-base">Quay lại</span>
        </button>
        <h1 className="flex-1 text-center text-xl md:text-2xl font-bold text-blue-800">
          Thêm địa chỉ mới
        </h1>
        <div className="w-5 h-5" />
      </header>

      {/* Grid */}
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 h-full overflow-hidden no-scrollbar">
        {/* Form */}
        <section className="bg-white rounded-3xl shadow-xl p-6 md:p-8 space-y-6 flex flex-col h-full">
          <div className="flex items-center gap-3">
            <Compass className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
              Thông tin địa chỉ
            </h2>
          </div>

          <div className="space-y-5 flex-1">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tên địa chỉ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  placeholder="Ví dụ: Nhà riêng, Văn phòng..."
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:ring-2 transition-colors ${
                    errors.name
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-200 focus:ring-blue-500"
                  }`}
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Địa chỉ chi tiết <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  ref={addressInputRef}
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateForm("address", e.target.value)}
                  placeholder="Nhập địa chỉ hoặc tìm kiếm trên bản đồ..."
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:ring-2 transition-colors ${
                    errors.address
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-200 focus:ring-blue-500"
                  }`}
                />
                <Map className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              {errors.address && (
                <p className="text-red-500 text-xs mt-1">{errors.address}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={isSaving}
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white border-t-2 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              {isSaving ? "Đang lưu..." : "Lưu địa chỉ"}
            </button>
          </div>
        </section>

        {/* Map */}
        <section className="bg-white rounded-3xl shadow-xl p-6 flex flex-col h-full overflow-hidden no-scrollbar">
          <div className="flex items-center gap-3 mb-4">
            <Map className="w-6 h-6 text-blue-600" />
            <span className="text-sm md:text-base font-semibold text-gray-800">
              Kéo pin để chọn vị trí chính xác
            </span>
          </div>
          <div
            ref={mapRef}
            className="flex-1 w-full h-[400px] md:h-[500px] rounded-xl border border-gray-100 shadow-inner"
          />
          {errors.map && (
            <p className="text-red-500 text-xs mt-2 text-center">{errors.map}</p>
          )}
        </section>
      </div>
    </div>
  );
}