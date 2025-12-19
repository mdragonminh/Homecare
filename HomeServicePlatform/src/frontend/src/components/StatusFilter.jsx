import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, RefreshCw, Check } from "lucide-react";

const StatusFilter = ({ selectedStatus, setSelectedStatus, loadBookings, loading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const statusOptions = [
    { value: "", label: "Tất cả trạng thái", color: "bg-gray-400", hoverBg: "hover:bg-gray-100", textColor: "text-gray-600" },
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
          </div>

          <motion.button
            whileHover={{ scale: 1.005, backgroundColor: "#fff" }} // Hiệu ứng phóng to nhẹ khi hover
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsOpen(!isOpen)}
            className={`
              w-full flex items-center justify-between px-4 py-3
              bg-gray-50/50 border rounded-xl transition-all duration-200
              hover:border-blue-300 hover:shadow-md /* Hover border và shadow */
              ${isOpen ? "border-blue-500 bg-white ring-4 ring-blue-500/5 shadow-sm" : "border-gray-200"}
            `}
          >
            <div className="flex items-center gap-3">
              {/* Hiệu ứng pulse nhẹ cho chấm tròn */}
              <div className="relative flex items-center justify-center">
                 <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm z-10 ${currentStatus.color}`} />
                 <div className={`absolute w-2.5 h-2.5 rounded-full animate-ping opacity-20 ${currentStatus.color}`} />
              </div>
              <span className="text-sm font-bold text-gray-700">{currentStatus.label}</span>
            </div>
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
              <ChevronDown className={`w-4 h-4 transition-colors ${isOpen ? "text-blue-500" : "text-gray-400"}`} />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {isOpen && (
              <>
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
                  <div >
                    {statusOptions.map((option) => (
                      <motion.button
                        key={option.value}
                        whileHover={{ x: 5 }} // Nhích sang phải nhẹ khi hover
                        onClick={() => {
                          setSelectedStatus(option.value);
                          setIsOpen(false);
                        }}
                        className={`
                          w-full flex items-center justify-between px-4 py-3.5 text-sm
                          transition-all duration-150
                          ${option.hoverBg} /* Sử dụng màu hover riêng cho từng trạng thái */
                          ${selectedStatus === option.value ? "bg-blue-50/50" : "bg-transparent"}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${option.color} group-hover:scale-125 transition-transform`} />
                          <span className={`transition-colors ${selectedStatus === option.value ? "font-bold text-blue-600" : "font-medium text-gray-600"}`}>
                            {option.label}
                          </span>
                        </div>
                        {selectedStatus === option.value && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <Check className="w-4 h-4 text-blue-600" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Refresh Button */}
        <motion.button
          whileHover={{ 
            scale: 1.02, 
            backgroundColor: "#1d4ed8", // Đậm hơn (blue-700) khi hover
            boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.4)" 
          }}
          whileTap={{ scale: 0.95 }}
          onClick={loadBookings}
          disabled={loading}
          className="
            flex items-center justify-center gap-2
            bg-blue-600 text-white
            px-6 py-3 md:py-2.5 rounded-xl
            text-sm font-bold shadow-lg shadow-blue-200/50
            transition-all duration-200
            disabled:opacity-50 disabled:pointer-events-none
            h-[48px] md:h-[46px]
          "
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
          <span className="hidden sm:inline">{loading ? "Đang tải..." : "Làm mới"}</span>
          <span className="sm:hidden">{loading ? "Đang tải..." : "Cập nhật dữ liệu"}</span>
        </motion.button>
      </div>
    </div>
  );
};

export default StatusFilter;