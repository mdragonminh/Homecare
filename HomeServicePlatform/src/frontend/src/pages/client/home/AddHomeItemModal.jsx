import { useState, useCallback } from "react";
import { X, Wrench, Package, Tag, Hash, FileText, Loader2 } from "lucide-react";
import { homeApi } from "../../../services/homeApi";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const itemTypes = ["appliance", "furniture", "electronics", "tool", "other"];
const MOCK_BRANDS = [
  "Samsung",
  "LG",
  "Sony",
  "Apple",
  "Bosch",
  "Siemens",
  "Panasonic",
  "Electrolux",
  "Xiaomi",
  "Daikin",
  "Casio",
  "Lenovo",
];

const getBrandSuggestions = (query) => {
  if (!query) return [];
  const lowerQuery = query.toLowerCase();
  return MOCK_BRANDS.filter((brand) =>
    brand.toLowerCase().includes(lowerQuery)
  ).slice(0, 5); 
};
export default function AddHomeItemModal({ homeId, onClose, onSuccess }) {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    type: "appliance", 
    modelNumber: "",
    serialNumber: "",
    notes: "",
  });
  const [brandSuggestions, setBrandSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);

    // Cập nhật gợi ý cho trường brand
    if (name === "brand") {
      const suggestions = getBrandSuggestions(value);
      setBrandSuggestions(suggestions);
    }
  };
  const handleSelectBrand = useCallback((selectedBrand) => {
    setFormData((prev) => ({ ...prev, brand: selectedBrand }));
    setBrandSuggestions([]); 
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (
      !formData.name ||
      !formData.type ||
      !formData.brand ||
      !formData.modelNumber
    ) {
      let validationError =
        t("validation.required_fields_missing") ||
        "Vui lòng điền đầy đủ các trường bắt buộc (Tên, Loại, Thương hiệu, Mã Model).";

      if (!formData.name)
        validationError =
          t("validation.item_name_required") || "Tên vật phẩm là bắt buộc.";
      else if (!formData.brand)
        validationError =
          t("validation.brand_required") || "Thương hiệu là bắt buộc.";
      else if (!formData.type)
        validationError =
          t("validation.type_required") || "Loại vật phẩm là bắt buộc.";
      else if (!formData.modelNumber)
        validationError =
          t("validation.model_number_required") || "Mã Model là bắt buộc.";

      setError(validationError);
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      homeId: homeId, 
    };
    const addPromise = homeApi.addHomeItem(payload);

    toast.promise(addPromise, {
      loading: t("ui.adding_item_loading") || "Đang thêm vật phẩm mới...",
      success: (result) => {
        setLoading(false);
        if (result.success) {
          onSuccess && onSuccess();
          onClose();
          return (
            t("success.item_added", { item_name: formData.name }) ||
            `Đã thêm "${formData.name}" thành công!`
          );
        } else {
          return (
            result.message ||
            t("error.add_item_unknown") ||
            "Thêm vật phẩm thất bại."
          );
        }
      },
      error: (err) => {
        setLoading(false);
        console.error("Submission error:", err);

        return (
          t("error.network_connect_failed") ||
          "Lỗi kết nối mạng, vui lòng thử lại."
        );
      },
    });
  };

  const getItemTypeLabel = (typeKey) => {
    return t(`item.type.${typeKey}`);
  };

  return (
    // ... (Modal wrapper and Header remain the same)
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100 animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Wrench className="text-blue-600" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {t("ui.add_item_modal_title")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            disabled={loading} 
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("form.label.item_name")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Package
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                type="text"
                placeholder={t("form.placeholder.item_name")}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label
                htmlFor="brand"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("form.label.brand")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Tag
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  onBlur={() =>
                    setTimeout(() => setBrandSuggestions([]), 200)
                  }
                  type="text"
                  placeholder={t("form.placeholder.brand")}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  disabled={loading}
                  autoComplete="off" 
                />
              </div>

              {/* 4. Create Suggestion UI */}
              {brandSuggestions.length > 0 && (
                <ul className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {brandSuggestions.map((brand) => (
                    <li
                      key={brand}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectBrand(brand);
                      }}
                      className="px-4 py-2 cursor-pointer hover:bg-blue-50 text-gray-800"
                    >
                      {brand}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Loại */}
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("form.label.item_type")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Wrench
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none bg-white appearance-none transition-all cursor-pointer"
                  disabled={loading}
                >
                  {itemTypes.map((type) => (
                    <option key={type} value={type}>
                      {getItemTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Mã Model */}
            <div>
              <label
                htmlFor="modelNumber"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("form.label.model_number")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="modelNumber"
                  name="modelNumber"
                  value={formData.modelNumber}
                  onChange={handleChange}
                  type="text"
                  placeholder={t("form.placeholder.model_number")}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="serialNumber"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("form.label.serial_number")}
              </label>
              <div className="relative">
                <Hash
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="serialNumber"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  type="text"
                  placeholder={t("form.placeholder.serial_number")}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("form.label.notes")}
            </label>
            <div className="relative">
              <FileText
                size={18}
                className="absolute left-3 top-4 text-gray-400"
              />
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder={t("form.placeholder.notes")}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                disabled={loading}
              />
            </div>
          </div>
          {error && (
            <div className="p-3 rounded-lg text-sm font-medium bg-red-100 text-red-700">
              {error}
            </div>
          )}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              disabled={loading}
            >
              {t("ui.cancel")}
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("ui.adding") || "Đang thêm..."}
                </>
              ) : (
                t("ui.add_item")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}