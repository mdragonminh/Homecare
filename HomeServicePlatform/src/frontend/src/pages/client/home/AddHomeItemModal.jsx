import { useState, useCallback } from "react";
import {
  X,
  Wrench,
  Package,
  Tag,
  Hash,
  FileText,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { homeApi } from "../../../services/homeApi";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// --- Constants ---
const itemTypes = ["appliance", "furniture", "electronics", "tool", "other"];
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_FILES = 2;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

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

// --- Component ---
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

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const [brandSuggestions, setBrandSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [generalError, setGeneralError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const formDisabled = loading || isScanning;

  const getInputClasses = (fieldName, isSelect = false) => {
    const prClass = isSelect ? "pr-10" : "pr-4";

    return `w-full pl-10 ${prClass} py-2.5 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
      fieldErrors[fieldName]
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300"
    } ${isSelect ? "bg-white appearance-none cursor-pointer" : ""}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    setGeneralError(null);

    if (name === "brand") {
      const suggestions = getBrandSuggestions(value);
      setBrandSuggestions(suggestions);
    }
  };

  const handleSelectBrand = useCallback(
    (selectedBrand) => {
      setFormData((prev) => ({ ...prev, brand: selectedBrand }));
      if (fieldErrors.brand) {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.brand;
          return newErrors;
        });
      }
      setBrandSuggestions([]);
    },
    [fieldErrors.brand]
  );
  const handleFileChange = async (e) => {
    const newFiles = Array.from(e.target.files);
    e.target.value = null;

    if (newFiles.length === 0) return;
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.itemImage;
      return newErrors;
    });
    setGeneralError(null);
    for (const file of newFiles) {
      if (selectedFiles.length >= MAX_FILES) {
        setFieldErrors((prev) => ({
          ...prev,
          itemImage:
            t("validation.max_file_count", { max: MAX_FILES }) ||
            `Chỉ được chọn tối đa ${MAX_FILES} ảnh.`,
        }));
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setFieldErrors((prev) => ({
          ...prev,
          itemImage:
            t("validation.image_type_invalid") ||
            "File không đúng định dạng JPG, JPEG hoặc PNG.",
        }));
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFieldErrors((prev) => ({
          ...prev,
          itemImage:
            t("validation.image_size_too_large") ||
            `Kích thước file không được quá ${MAX_FILE_SIZE_MB}MB.`,
        }));
        return;
      }
      const updatedFiles = [...selectedFiles, file];
      setSelectedFiles(updatedFiles);
      await scanSingleFile(file);
    }
  };
  const scanSingleFile = async (file) => {
    setIsScanning(true);

    try {
      const result = await homeApi.scanHomeItem([file]);

      setIsScanning(false);

      if (result.success && result.data) {
        const scannedData = result.data;

        setFormData((prev) => ({
          ...prev,
          name: scannedData.name || prev.name,
          brand: scannedData.brand || prev.brand,
          type:
            scannedData.type &&
            itemTypes.includes(scannedData.type.toLowerCase())
              ? scannedData.type.toLowerCase()
              : prev.type,
          modelNumber: scannedData.modelNumber || prev.modelNumber,
          serialNumber: scannedData.serialNumber || prev.serialNumber,
          notes: (scannedData.notes
            ? prev.notes
              ? `${prev.notes}\n${scannedData.notes}`
              : scannedData.notes
            : prev.notes
          ).trim(),
        }));
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          if (scannedData.name) delete newErrors.name;
          if (scannedData.brand) delete newErrors.brand;
          if (scannedData.modelNumber) delete newErrors.modelNumber;
          if (scannedData.serialNumber) delete newErrors.serialNumber;
          if (scannedData.type) delete newErrors.type;
          return newErrors;
        });

        toast.success(
          t("success.item_scanned_filled") ||
            `Đã quét ảnh "${file.name}" thành công!`
        );
      } else {
        setSelectedFiles((prev) => prev.filter((f) => f !== file));

        const errorMsg =
          result.message ||
          t("error.scan_item_unknown") ||
          "Quét vật phẩm thất bại.";

        setFieldErrors((prev) => ({
          ...prev,
          itemImage: errorMsg,
        }));

        toast.error(errorMsg);
      }
    } catch (err) {
      setIsScanning(false);
      setSelectedFiles((prev) => prev.filter((f) => f !== file));

      console.error("Scanning error:", err);

      const networkError =
        t("error.network_connect_failed") || "Lỗi kết nối mạng khi quét ảnh.";
      setFieldErrors((prev) => ({
        ...prev,
        itemImage: networkError,
      }));

      toast.error(networkError);
    }
  };
  const handleRemoveFile = (fileToRemove) => {
    setSelectedFiles((prev) => prev.filter((f) => f !== fileToRemove));
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.itemImage;
      return newErrors;
    });
    setGeneralError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);
    const errors = {};
    if (!formData.name.trim()) {
      errors.name =
        t("validation.item_name_required") || "Tên vật phẩm là bắt buộc.";
    }
    if (!formData.brand.trim()) {
      errors.brand =
        t("validation.brand_required") || "Thương hiệu là bắt buộc.";
    }
    if (!formData.type || !itemTypes.includes(formData.type)) {
      errors.type =
        t("validation.type_required") || "Loại vật phẩm là bắt buộc.";
    }
    if (!formData.modelNumber.trim()) {
      errors.modelNumber =
        t("validation.model_number_required") || "Mã Model là bắt buộc.";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    // --- SUBMISSION ---
    setLoading(true);

    const payload = { ...formData, homeId: homeId };
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
          const apiError =
            result.message ||
            t("error.add_item_unknown") ||
            "Thêm vật phẩm thất bại.";
          setGeneralError(apiError);
          return apiError;
        }
      },
      error: (err) => {
        setLoading(false);
        console.error("Submission error:", err);
        const networkError =
          t("error.network_connect_failed") ||
          "Lỗi kết nối mạng, vui lòng thử lại.";
        setGeneralError(networkError);
        return networkError;
      },
    });
  };

  const getItemTypeLabel = (typeKey) => {
    return t(`item.type.${typeKey}`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100 animate-scale-in flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Wrench className="text-blue-600" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {t("ui.add_item_modal_title") || "Thêm Vật Phẩm/Thiết Bị"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            disabled={formDisabled}
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
            <div className="border-b pb-4 border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("form.label.item_image_scan") ||
                  `Ảnh Sản phẩm (Tùy chọn, tối đa ${MAX_FILES} ảnh)`}
              </label>
              <div className="space-y-2">
                {selectedFiles.length < MAX_FILES && !isScanning && (
                  <label
                    htmlFor="itemImage"
                    className={`inline-flex items-center px-4 py-2 border rounded-lg transition-all font-medium text-sm cursor-pointer
                      ${
                        formDisabled
                          ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                          : "border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100"
                      }`}
                  >
                    <UploadCloud className="w-4 h-4 mr-2" />
                    {t("ui.upload") || "Tải ảnh lên"}
                    <input
                      id="itemImage"
                      name="itemImage"
                      type="file"
                      accept={ACCEPTED_IMAGE_TYPES.join(",")}
                      onChange={handleFileChange}
                      className="sr-only"
                      disabled={formDisabled}
                      multiple
                    />
                  </label>
                )}
                {isScanning && (
                  <div className="inline-flex items-center px-4 py-2 border border-blue-500 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("ui.scanning") || "Đang quét..."}
                  </div>
                )}
                {selectedFiles.length > 0 && (
                  <div
                    style={{ maxHeight: "120px" }}
                    className={`space-y-2 overflow-y-auto border rounded-lg p-2 transition-all ${
                      fieldErrors.itemImage
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-2 border rounded-lg bg-white ${
                          fieldErrors.itemImage
                            ? "border-red-300"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file)}
                          className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                          disabled={formDisabled}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {selectedFiles.length > 0 && (
                  <p className="text-xs text-gray-500 pt-1">
                    {t("ui.files_count", {
                      count: selectedFiles.length,
                      max: MAX_FILES,
                    }) || `${selectedFiles.length}/${MAX_FILES} ảnh`}
                  </p>
                )}
              </div>
              {fieldErrors.itemImage && (
                <p className="mt-2 text-sm text-red-600">
                  {fieldErrors.itemImage}
                </p>
              )}

              <p className="mt-2 text-xs text-gray-400">
                {t("form.label.image_hint", { size: MAX_FILE_SIZE_MB }) ||
                  `JPG, JPEG, PNG. Max ${MAX_FILE_SIZE_MB}MB/file. Quét tự động điền form.`}
              </p>
            </div>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("form.label.item_name") || "Tên Vật Phẩm"}{" "}
                <span className="text-red-500"></span>
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
                  placeholder={
                    t("form.placeholder.item_name") || "Nhập tên vật phẩm"
                  }
                  className={getInputClasses("name")}
                  disabled={formDisabled}
                />
              </div>
              {fieldErrors.name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label
                  htmlFor="brand"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("form.label.brand") || "Thương hiệu"}{" "}
                  <span className="text-red-500"></span>
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
                    placeholder={
                      t("form.placeholder.brand") || "Nhập thương hiệu"
                    }
                    className={getInputClasses("brand")}
                    disabled={formDisabled}
                    autoComplete="off"
                  />
                </div>
                {fieldErrors.brand && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.brand}
                  </p>
                )}

                {/* Suggestion UI */}
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
              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("form.label.item_type") || "Loại Vật Phẩm"}{" "}
                  <span className="text-red-500"></span>
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
                    className={getInputClasses("type", true)}
                    disabled={formDisabled}
                  >
                    {itemTypes.map((type) => (
                      <option key={type} value={type}>
                        {getItemTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>
                {fieldErrors.type && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.type}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Mã Model */}
              <div>
                <label
                  htmlFor="modelNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("form.label.model_number") || "Model"}{" "}
                  <span className="text-red-500"></span>
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
                    placeholder={
                      t("form.placeholder.model_number") || "Nhập mã Model"
                    }
                    className={getInputClasses("modelNumber")}
                    disabled={formDisabled}
                  />
                </div>
                {fieldErrors.modelNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.modelNumber}
                  </p>
                )}
              </div>

              {/* Mã Serial */}
              <div>
                <label
                  htmlFor="serialNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("form.label.serial_number") || "Serial Number"}
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
                    placeholder={
                      t("form.placeholder.serial_number") || "Nhập mã Serial"
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    disabled={formDisabled}
                  />
                </div>
              </div>
            </div>

            {/* Ghi chú */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("form.label.notes") || "Ghi chú"}
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
                  placeholder={
                    t("form.placeholder.notes") ||
                    "Thông tin thêm về thiết bị (ví dụ: vị trí, ngày mua...)"
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  disabled={formDisabled}
                />
              </div>
            </div>

            {/* Lỗi Chung */}
            {generalError && (
              <div className="p-3 rounded-lg text-sm font-medium bg-red-100 text-red-700">
                {generalError}
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                disabled={formDisabled}
              >
                {t("ui.cancel") || "Hủy bỏ"}
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
                  t("ui.add_item") || "Thêm Vật Phẩm"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
