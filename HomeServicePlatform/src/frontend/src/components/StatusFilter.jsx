import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, RefreshCw, Check } from "lucide-react";

const StatusFilter = ({ selectedStatus, setSelectedStatus, loadBookings, loading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const statusOptions = [
    { value: "", label: "Tất cả trạng thái", color: "bg-gray-400", hoverBg: "hover:bg-gray-50", textColor: "text-gray-600" },
    { value: "0", label: "Chờ xử lý", color: "bg-amber-400", hoverBg: "hover:bg-amber-50", textColor: "text-amber-600" },
    { value: "1", label: "Đã xác nhận", color: "bg-blue-500", hoverBg: "hover:bg-blue-50", textColor: "text-blue-600" },
    { value: "2", label: "Đang đến", color: "bg-indigo-500", hoverBg: "hover:bg-indigo-50", textColor: "text-indigo-600" },
    { value: "3", label: "Đang thực hiện", color: "bg-purple-500", hoverBg: "hover:bg-purple-50", textColor: "text-purple-600" },
    { value: "4", label: "Hoàn thành", color: "bg-emerald-500", hoverBg: "hover:bg-emerald-50", textColor: "text-emerald-600" },
    { value: "5", label: "Đã hủy", color: "bg-red-500", hoverBg: "hover:bg-red-50", textColor: "text-red-600" },
  ];

  const currentStatus = statusOptions.find(opt => opt.value === selectedStatus) || statusOptions[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-3 md:p-4 mb-6 border border-gray-100 relative z-[60]">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
        
        {/* Dropdown Container */}
        <div className="flex-1 relative" ref={dropdownRef}>
          <div className="flex justify-between items-center mb-1.5 px-1">
            <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Trạng thái đơn hàng
            </label>
            {/* Trên Mobile: Hiển thị nút làm mới nhỏ gọn ở góc nếu cần tiết kiệm chỗ */}
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsOpen(!isOpen)}
            className={`
              w-full flex items-center justify-between px-4 py-3
              bg-gray-50/50 border rounded-xl transition-all duration-200
              ${isOpen ? "border-blue-500 bg-white ring-4 ring-blue-500/5 shadow-sm" : "border-gray-200"}
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm ${currentStatus.color}`} />
              <span className="text-sm font-bold text-gray-700">{currentStatus.label}</span>
            </div>
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
              <ChevronDown className={`w-4 h-4 ${isOpen ? "text-blue-500" : "text-gray-400"}`} />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {isOpen && (
              <>
                {/* Mobile Backdrop: Giúp đóng menu dễ hơn trên điện thoại */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsOpen(false)}
                  className="fixed inset-0 z-[90] bg-black/5 sm:hidden"
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 8, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full left-0 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 z-[100] overflow-hidden"
                >
                  <div className="max-h-[60vh] overflow-y-auto scrollbar-hide">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedStatus(option.value);
                          setIsOpen(false);
                        }}
                        className={`
                          w-full flex items-center justify-between px-4 py-3.5 text-sm
                          ${selectedStatus === option.value ? "bg-blue-50/50" : "active:bg-gray-50"}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${option.color}`} />
                          <span className={`transition-colors ${selectedStatus === option.value ? "font-bold text-blue-600" : "font-medium text-gray-600"}`}>
                            {option.label}
                          </span>
                        </div>
                        {selectedStatus === option.value && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Refresh Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.95 }}
          onClick={loadBookings}
          disabled={loading}
          className="
            flex items-center justify-center gap-2
            bg-blue-600 text-white
            px-6 py-3 md:py-2.5 rounded-xl
            text-sm font-bold shadow-lg shadow-blue-200/50
            active:bg-blue-700 transition-colors
            disabled:opacity-50
            h-[48px] md:h-[46px]
          "
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">{loading ? "Đang tải..." : "Làm mới"}</span>
          <span className="sm:hidden">{loading ? "Đang tải..." : "Cập nhật dữ liệu"}</span>
        </motion.button>
      </div>
    </div>
  );
};

export default StatusFilter;