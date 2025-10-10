// src/components/ServiceMegaMenu.jsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { serviceApi } from '../../../services/serviceApi.jsx'; 

export function ServiceMegaMenu() {
    const { t } = useTranslation();
    const [serviceData, setServiceData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    // ⭐️ State mới: Lưu ID của danh mục đang được hover để hiển thị cột bên phải
    const [activeCategory, setActiveCategory] = useState(null); 

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const result = await serviceApi.getServices();
            if (result.success && result.data.length > 0) {
                setServiceData(result.data);
                // ⭐️ Đặt danh mục đầu tiên làm mặc định khi tải xong
                setActiveCategory(result.data[0].category.id); 
            }
            setIsLoading(false);
        };
        loadData();
    }, []);

    // ⭐️ Tìm dữ liệu dịch vụ của danh mục đang hoạt động
    const activeServices = serviceData.find(
        (group) => group.category.id === activeCategory
    );

    return (
        <div className="relative group">
            
            {/* 1. Nút Dịch vụ */}
            <div 
                className="px-5 py-2.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-semibold cursor-default"
            >
                {t("nav.services")}
            </div>

            {/* 2. Mega Menu Content: Hai cột - Sidebar + Content */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[650px] bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-200 z-50 
                            opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                
                {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Đang tải dịch vụ...</span>
                    </div>
                ) : serviceData.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">Không tìm thấy dịch vụ nào</div>
                ) : (
                    // ⭐️ CONTAINER CHÍNH: Layout chia 2
                    <div className="flex divide-x divide-gray-100">
                        
                        {/* CỘT TRÁI: Danh sách Danh mục (Sidebar) */}
                        <div className="w-1/3 p-2 bg-gray-50 max-h-[400px] overflow-y-auto">
                            <ul className="space-y-1">
                                {serviceData.map((group) => (
                                    <li 
                                        key={group.category.id}
                                        // ⭐️ HIỆU ỨNG HOVER
                                        onMouseEnter={() => setActiveCategory(group.category.id)}
                                        className={`px-3 py-2 rounded-lg cursor-pointer transition-all 
                                            ${activeCategory === group.category.id 
                                                ? 'bg-blue-600 text-white shadow-md' 
                                                : 'text-gray-700 hover:bg-gray-100'
                                            }`
                                        }
                                    >
                                        <div className="flex items-center justify-between text-sm font-medium">
                                            {group.category.name}
                                            {/* Icon mũi tên cho danh mục đang hoạt động */}
                                            {activeCategory === group.category.id && (
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* CỘT PHẢI: Chi tiết Dịch vụ */}
                        <div className="w-2/3 p-4 max-h-[400px] overflow-y-auto">
                            
                            {activeServices ? (
                                <>
                                    <h4 className="font-bold text-gray-800 text-base mb-3 pb-1 border-b border-gray-100">
                                        Dịch vụ {activeServices.category.name}
                                    </h4>
                                    <ul className="space-y-1">
                                        {activeServices.services.map((service) => (
                                            <li key={service.id}>
                                                <a 
                                                    href={`/services/${service.id}`} 
                                                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all group/item"
                                                >
                                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <span className="text-sm font-medium">{service.name}</span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                <div className="p-4 text-center text-gray-500">
                                    Vui lòng chọn một danh mục để xem dịch vụ.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Custom scrollbar styles (Có thể bỏ nếu bạn đã có global styles) */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #93c5fd; /* light blue */
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #60a5fa;
                }
            `}</style>
        </div>
    );
}