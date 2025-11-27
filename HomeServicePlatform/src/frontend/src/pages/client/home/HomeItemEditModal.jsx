import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { homeApi } from "../../../services/homeApi";

const initialItemState = {
    name: "",
    brand: "",
    type: "",
    modelNumber: "",
    serialNumber: "",
    notes: "",
};

const itemTypes = [
    "appliance",
    "furniture",
    "electronics",
    "tool",
    "other",
];

export default function HomeItemEditModal({ homeItemId, onClose, onSuccess }) {
    const { t } = useTranslation();
    const [itemData, setItemData] = useState(initialItemState);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    // THAY ĐỔI 1: Sử dụng object để lưu lỗi cho từng trường
    const [validationErrors, setValidationErrors] = useState({}); 

    // Fetch item details
    useEffect(() => {
        const fetchItemDetails = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                const res = await homeApi.getHomeItemById(homeItemId);
                if (res.success) {
                    const { name, brand, type, modelNumber, serialNumber, notes } = res.data;
                    setItemData({
                        name: name || "",
                        brand: brand || "",
                        type: type || itemTypes[0],
                        modelNumber: modelNumber || "",
                        serialNumber: serialNumber || "",
                        notes: notes || "",
                    });
                } else {
                    setFetchError(res.message);
                }
            } catch (err) {
                console.error("Error fetching item details:", err);
                setFetchError(t("error.fetch_failed") || "Lỗi khi tải chi tiết vật phẩm.");
            } finally {
                setLoading(false);
            }
        };

        if (homeItemId) {
            fetchItemDetails();
        }
    }, [homeItemId, t]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setItemData((prev) => ({ ...prev, [name]: value }));
        // THAY ĐỔI 2: Xóa lỗi cho trường cụ thể này khi người dùng thay đổi giá trị
        setValidationErrors((prev) => ({ ...prev, [name]: null })); 
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationErrors({}); // Đặt lại lỗi trước khi kiểm tra mới
        
        const errors = {};
        
        if (!itemData.name) {
            errors.name = t("validation.item_name_required") || "Tên vật phẩm là bắt buộc.";
        }
        if (!itemData.brand) {
            errors.brand = t("validation.brand_required") || "Thương hiệu là bắt buộc.";
        }
        if (!itemData.type) {
            errors.type = t("validation.type_required") || "Loại vật phẩm là bắt buộc.";
        }
        if (!itemData.modelNumber) {
            errors.modelNumber = t("validation.model_number_required") || "Mã Model là bắt buộc.";
        }
        
        // Nếu có lỗi, cập nhật trạng thái lỗi và dừng
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        setLoading(true);

        try {
            const res = await homeApi.updateHomeItem(homeItemId, itemData);
            setLoading(false); 

            if (res.success) {
                toast.success(t("success.item_edited") || "Item updated successfully!");
                onSuccess();
                onClose(); 
            } else {
                // Giữ nguyên lỗi API (nếu có), sử dụng một key riêng biệt
                setValidationErrors({ apiError: res.message }); 
            }
        } catch (err) {
            setLoading(false);
            console.error("Error updating item:", err);
            setValidationErrors({ apiError: t("error.network_connect_failed") || "Lỗi kết nối mạng, vui lòng thử lại." });
        }
    };
    
    // ... (Phần hiển thị lỗi fetchError không thay đổi)
    if (fetchError) {
        return (
            <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transform scale-100 transition-transform duration-300">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{t("error.error_occurred")}</h3>
                    <p className="text-gray-600 mb-4 text-sm">{fetchError}</p>
                    <button
                        onClick={onClose}
                        className="px-5 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md text-sm"
                    >
                        {t("ui.back_to_home")}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {t("ui.edit")} {t("ui.manage_items").toLowerCase()}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition duration-200"
                        disabled={loading}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 bg-gray-50">
                    {loading && !fetchError && (
                        <div className="flex flex-col items-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
                            <p className="text-gray-600 text-sm">{t("ui.loading_data")}</p>
                        </div>
                    )}

                    {!loading && (
                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            {/* THAY ĐỔI 3: Hiển thị lỗi API/network chung ở đây */}
                            {validationErrors.apiError && (
                                <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl shadow-sm border border-red-100">
                                    {validationErrors.apiError}
                                </div>
                            )}

                            {/* Input: Item Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t("form.label.item_name")} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={itemData.name}
                                    onChange={handleChange}
                                    placeholder={t("form.placeholder.item_name")}
                                    className={`block w-full border rounded-xl shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 bg-white ${
                                        validationErrors.name ? "border-red-400" : "border-gray-200" // Cập nhật style border
                                    }`}
                                />
                                {validationErrors.name && (
                                    <p className="mt-1 text-xs text-red-500">{validationErrors.name}</p> // Hiển thị lỗi riêng
                                )}
                            </div>

                            {/* Select: Item Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t("form.label.item_type")} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="type"
                                    value={itemData.type}
                                    onChange={handleChange}
                                    className={`block w-full border rounded-xl shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 bg-white ${
                                        validationErrors.type ? "border-red-400" : "border-gray-200"
                                    }`}
                                >
                                    {itemTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {t(`item.type.${type}`, type)}
                                        </option>
                                    ))}
                                </select>
                                {validationErrors.type && (
                                    <p className="mt-1 text-xs text-red-500">{validationErrors.type}</p>
                                )}
                            </div>

                            {/* Input: Brand */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t("form.label.brand")} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={itemData.brand}
                                    onChange={handleChange}
                                    placeholder={t("form.placeholder.brand")}
                                    className={`block w-full border rounded-xl shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 bg-white ${
                                        validationErrors.brand ? "border-red-400" : "border-gray-200"
                                    }`}
                                />
                                {validationErrors.brand && (
                                    <p className="mt-1 text-xs text-red-500">{validationErrors.brand}</p>
                                )}
                            </div>

                            {/* Input: Model Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t("form.label.model_number")} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="modelNumber"
                                    value={itemData.modelNumber}
                                    onChange={handleChange}
                                    placeholder={t("form.placeholder.model_number")}
                                    className={`block w-full border rounded-xl shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 bg-white ${
                                        validationErrors.modelNumber ? "border-red-400" : "border-gray-200"
                                    }`}
                                />
                                {validationErrors.modelNumber && (
                                    <p className="mt-1 text-xs text-red-500">{validationErrors.modelNumber}</p>
                                )}
                            </div>

                            {/* Input: Serial Number (Không bắt buộc, không cần kiểm tra lỗi) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t("form.label.serial_number")}
                                </label>
                                <input
                                    type="text"
                                    name="serialNumber"
                                    value={itemData.serialNumber}
                                    onChange={handleChange}
                                    placeholder={t("form.placeholder.serial_number")}
                                    className="block w-full border border-gray-200 rounded-xl shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 bg-white"
                                />
                            </div>

                            {/* Textarea: Notes (Không bắt buộc, không cần kiểm tra lỗi) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t("form.label.notes")}
                                </label>
                                <textarea
                                    name="notes"
                                    rows="3"
                                    value={itemData.notes}
                                    onChange={handleChange}
                                    placeholder={t("form.placeholder.notes")}
                                    className="block w-full border border-gray-200 rounded-xl shadow-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 bg-white"
                                />
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex justify-end pt-4 space-x-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex items-center gap-1.5 px-5 py-1.5 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition duration-200 shadow-sm disabled:bg-gray-100 disabled:text-gray-400 text-sm"
                                    disabled={loading}
                                >
                                    {t("ui.cancel")}
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center gap-1.5 px-5 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full hover:from-blue-600 hover:to-indigo-700 transition duration-200 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {t("ui.saving")}
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            {t("ui.save_item") || "Save"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}