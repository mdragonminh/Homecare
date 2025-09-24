import { useState, useEffect, useRef } from "react";
import { MapPin, ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { homeApi } from "../../../services/homeApi";
import L from "leaflet"; // Import Leaflet

export default function AddAddressPage() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const addressInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: 21.0285, // Tọa độ mặc định cho Hà Nội
    longitude: 105.8542,
    customerProfileId: localStorage.getItem("userId") || "",
  });

  // Debug: Kiểm tra userId
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    console.log("Current userId from localStorage:", userId);
    if (!userId) {
      toast.error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.", 
        { position: "top-right" });
    }
  }, []);

  // Cập nhật state khi input thay đổi
  const updateForm = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      console.log("Form data updated:", newData); // Debug
      return newData;
    });
  };

  // Khởi tạo bản đồ Leaflet
  useEffect(() => {
    if (!mapRef.current) return;

    mapInstance.current = L.map(mapRef.current).setView(
      [formData.latitude, formData.longitude],
      13
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(mapInstance.current);

    markerInstance.current = L.marker([formData.latitude, formData.longitude], {
      draggable: true,
    }).addTo(mapInstance.current);

    markerInstance.current.on("dragend", (e) => {
      const pos = e.target.getLatLng();
      console.log("Marker moved to:", pos.lat, pos.lng); // Debug
      setFormData((prev) => ({ 
        ...prev, 
        latitude: pos.lat, 
        longitude: pos.lng 
      }));
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Khởi tạo Google Maps Autocomplete
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

      console.log("Place selected:", { newAddress, newLat, newLng }); // Debug

      setFormData((prev) => ({
        ...prev,
        address: newAddress,
        latitude: newLat,
        longitude: newLng,
      }));

      if (markerInstance.current && mapInstance.current) {
        markerInstance.current.setLatLng([newLat, newLng]);
        mapInstance.current.setView([newLat, newLng], 16);
      }
    });
  }, []);

  // Cập nhật vị trí marker khi formData thay đổi
  useEffect(() => {
    if (markerInstance.current) {
      markerInstance.current.setLatLng([formData.latitude, formData.longitude]);
      mapInstance.current?.setView([formData.latitude, formData.longitude], 13);
    }
  }, [formData.latitude, formData.longitude]);

  const handleSave = async () => {
    // Validation chi tiết
    if (!formData.name || formData.name.trim() === '') {
      toast.error("Vui lòng nhập tên home!", { position: "top-right", autoClose: 3000 });
      return;
    }
    
    if (!formData.address || formData.address.trim() === '') {
      toast.error("Vui lòng nhập địa chỉ!", { position: "top-right", autoClose: 3000 });
      return;
    }
    
    if (!formData.customerProfileId || formData.customerProfileId.trim() === '') {
      toast.error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại!", 
        { position: "top-right", autoClose: 3000 });
      return;
    }

    if (!formData.latitude || !formData.longitude || 
        isNaN(formData.latitude) || isNaN(formData.longitude)) {
      toast.error("Tọa độ không hợp lệ. Vui lòng chọn vị trí trên bản đồ!", 
        { position: "top-right", autoClose: 3000 });
      return;
    }

    console.log("Submitting form data:", formData); // Debug

    try {
      const res = await homeApi.createHome(formData);

      if (res.success) {
        toast.success("Đã lưu địa chỉ thành công!", { position: "top-right", autoClose: 2000 });
        setTimeout(() => navigate("/"), 2000); // Delay để người dùng thấy toast
      } else {
        console.error("API Error:", res.message); // Debug
        toast.error(res.message || "Có lỗi xảy ra khi lưu địa chỉ", 
          { position: "top-right", autoClose: 3000 });
      }
    } catch (error) {
      console.error("Unexpected error:", error); // Debug
      toast.error("Có lỗi không mong muốn xảy ra", 
        { position: "top-right", autoClose: 3000 });
    }
  };

  const handleCancel = () => navigate("/");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-700 to-emerald-500">
      <div className="bg-white shadow-lg px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={handleCancel} className="flex items-center gap-2 text-blue-600">
          <ArrowLeft className="w-5 h-5" />
          Quay lại
        </button>
        <h1 className="text-2xl font-bold text-blue-900">Thêm home mới</h1>
      </div>

      <div className="max-w-7xl mx-auto p-6 lg:grid lg:grid-cols-2 lg:gap-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              Tên home <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateForm("name", e.target.value)}
              className="w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Ví dụ: Nhà riêng, Văn phòng..."
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              Địa chỉ <span className="text-red-500">*</span>
            </label>
            <input
              ref={addressInputRef}
              type="text"
              value={formData.address}
              onChange={(e) => updateForm("address", e.target.value)}
              className="w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập địa chỉ hoặc tìm kiếm..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">Latitude</label>
              <input
                type="number"
                step="any"
                placeholder="21.0285"
                value={formData.latitude}
                onChange={(e) => updateForm("latitude", parseFloat(e.target.value) || 0)}
                className="border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">Longitude</label>
              <input
                type="number"
                step="any"
                placeholder="105.8542"
                value={formData.longitude}
                onChange={(e) => updateForm("longitude", parseFloat(e.target.value) || 0)}
                className="border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Debug info - có thể xóa sau khi fix */}
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            Debug: UserID = {formData.customerProfileId || "Chưa có"}
          </div>

          <div className="flex gap-4 pt-6">
            <button
              onClick={handleCancel}
              className="flex-1 border rounded-lg py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-blue-700"
            >
              <Check className="inline w-4 h-4 mr-2" />
              Lưu home
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              Kéo pin trên bản đồ hoặc nhập địa chỉ để chọn vị trí chính xác
            </span>
          </div>
          <div
            ref={mapRef}
            className="w-full h-[500px] rounded-lg border border-gray-200 shadow-inner"
          />
        </div>
      </div>
    </div>
  );
}