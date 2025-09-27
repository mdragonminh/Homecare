import { useState } from "react";
import { X, Wrench, Package, Tag, Hash, FileText } from "lucide-react";
import { homeApi } from "../../../services/homeApi"; // Đảm bảo đúng đường dẫn

// Danh sách các loại vật phẩm ví dụ (Bạn có thể mở rộng)
const itemTypes = ["appliance", "furniture", "electronics", "tool", "other"];

const itemTypeLabels = {
    appliance: "Thiết bị Gia dụng",
    furniture: "Nội thất",
    electronics: "Thiết bị Điện tử",
    tool: "Dụng cụ",
    other: "Khác",
};

/**
 * Modal thêm vật phẩm/thiết bị vào một Home cụ thể.
 * @param {object} props
 * @param {string} props.homeId - ID của ngôi nhà đang được chọn.
 * @param {function} props.onClose - Hàm đóng modal.
 * @param {function} props.onSuccess - Hàm gọi khi thêm thành công (để refresh data).
 */
export default function AddHomeItemModal({ homeId, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: "",
        brand: "",
        type: "appliance", // Thiết lập mặc định
        modelNumber: "",
        serialNumber: "",
        notes: "", // Thêm trường notes vào state
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Xóa thông báo lỗi/thành công khi người dùng bắt đầu chỉnh sửa
        setError(null);
        setSuccessMessage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        // Kiểm tra validation cụ thể từng trường
        if (!formData.name) {
            setError("Vui lòng nhập tên vật phẩm.");
            setLoading(false);
            return;
        }
        if (!formData.brand) {
            setError("Vui lòng nhập thương hiệu.");
            setLoading(false);
            return;
        }
        if (!formData.type) {
            setError("Vui lòng chọn loại vật phẩm.");
            setLoading(false);
            return;
        }
        if (!formData.modelNumber) {
            setError("Vui lòng nhập mã model.");
            setLoading(false);
            return;
        }
        if (!formData.serialNumber) {
            setError("Vui lòng nhập số serial.");
            setLoading(false);
            return;
        }
        if (!formData.notes) {
            setError("Vui lòng nhập ghi chú.");
            setLoading(false);
            return;
        }

        try {
            // Gọi API đã có trong homeApi.jsx
            const result = await homeApi.addHomeItem({
                ...formData,
                homeId: homeId, // Truyền homeId vào payload
            });

            if (result.success) {
                setSuccessMessage("Thêm vật phẩm thành công!");
                setFormData({
                    name: "",
                    brand: "",
                    type: "appliance",
                    modelNumber: "",
                    serialNumber: "",
                    notes: "", // Reset form
                }); 
                
                // Chờ một chút rồi đóng modal và refresh data
                setTimeout(() => {
                    onSuccess && onSuccess();
                }, 1000);

            } else {
                // Xử lý lỗi từ API
                setError(result.message || "Lỗi không xác định khi thêm vật phẩm.");
            }
        } catch (err) {
            console.error("Submission error:", err);
            setError("Lỗi kết nối. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    return (
        // Khung Modal cố định
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100 animate-scale-in">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <Wrench className="text-blue-600" size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Thêm Vật Phẩm Mới</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    
                    {/* Tên Vật Phẩm */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Tên Vật Phẩm *</label>
                        <div className="relative">
                            <Package size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                type="text"
                                placeholder="Ví dụ: Máy lạnh Inverter"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Thương hiệu */}
                        <div>
                            <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">Thương hiệu *</label>
                            <div className="relative">
                                <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="brand"
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleChange}
                                    type="text"
                                    placeholder="Ví dụ: Samsung, Sony"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>
                        
                        {/* Loại */}
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Loại Vật Phẩm *</label>
                            <div className="relative">
                                <Wrench size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select
                                    id="type"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none bg-white appearance-none transition-all cursor-pointer"
                                    required
                                >
                                    {itemTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {itemTypeLabels[type]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {/* Mã Model */}
                        <div>
                            <label htmlFor="modelNumber" className="block text-sm font-medium text-gray-700 mb-1">Mã Model *</label>
                            <div className="relative">
                                <Hash size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="modelNumber"
                                    name="modelNumber"
                                    value={formData.modelNumber}
                                    onChange={handleChange}
                                    type="text"
                                    placeholder="Ví dụ: AS12ESQA"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Số Serial */}
                        <div>
                            <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 mb-1">Số Serial *</label>
                            <div className="relative">
                                <Hash size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="serialNumber"
                                    name="serialNumber"
                                    value={formData.serialNumber}
                                    onChange={handleChange}
                                    type="text"
                                    placeholder="Ví dụ: W34B5C6D"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Ghi chú */}
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Ghi chú *</label>
                        <div className="relative">
                            <FileText size={18} className="absolute left-3 top-4 text-gray-400" />
                            <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Thêm ghi chú về vật phẩm, ví dụ: tình trạng bảo hành, ngày mua..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    {/* Error & Success Messages */}
                    {(error || successMessage) && (
                        <div className={`p-3 rounded-lg text-sm font-medium ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {error || successMessage}
                        </div>
                    )}
                    
                    {/* Footer / Submit Button */}
                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 px-4 text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Đang thêm...' : 'Thêm Vật Phẩm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
