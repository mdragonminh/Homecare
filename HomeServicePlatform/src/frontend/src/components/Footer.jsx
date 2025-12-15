import { Home, Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from "lucide-react";
import React, { useState, useEffect } from "react";
import { serviceApi } from "../services/serviceApi"; 

export function Footer() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // LOGIC: Lấy danh sách dịch vụ từ API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await serviceApi.getServices();
        if (response.success) {
          // **Đã thay đổi:** Chỉ lấy 4 dịch vụ đầu tiên
          setServices(response.data.slice(0, 4) || []); 
        } else {
          console.error("Failed to fetch services for footer:", response.message);
        }
      } catch (error) {
        console.error("Error calling serviceApi.getServices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-gray-900" />
              </div>
              <span className="font-semibold text-lg">HomeServicePlatform</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Nền tảng quản lý dịch vụ nhà thông minh, kết nối mọi người trong cộng đồng
              để tạo ra trải nghiệm sống tốt nhất.
            </p>
            <div className="flex space-x-3">
              <Facebook className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <Twitter className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <Linkedin className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Liên kết nhanh</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="text-gray-400 hover:text-white transition-colors">Trang chủ</a></li>
              <li><a href="/services" className="text-gray-400 hover:text-white transition-colors">Dịch vụ</a></li>
              <li><a href="/about" className="text-gray-400 hover:text-white transition-colors">Về chúng tôi</a></li>
              <li><a href="/contact" className="text-gray-400 hover:text-white transition-colors">Liên hệ/Hỗ trợ</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Điều khoản</a></li>
            </ul>
          </div>

          {/* Services (Hiển thị 4 dịch vụ đầu tiên) */}
          <div className="space-y-4">
            <h4 className="font-semibold">Dịch vụ</h4>
            {loading ? (
              // Hiển thị loading state
              <div className="space-y-2 text-sm">
                <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3 animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-4/5 animate-pulse"></div>
              </div>
            ) : (
              <ul className="space-y-2 text-sm">
                {/* Dùng services.map để hiển thị 4 dịch vụ đã được giới hạn */}
                {services.map((service) => (
                  <li key={service.id}>
                    <a 
                      // **Liên kết trực tiếp đến trang chi tiết dịch vụ**
                      href={`/services`} 
                      className="text-gray-400 hover:text-white transition-colors"
                      title={service.description}
                    >
                      {service.name}
                    </a>
                  </li>
                ))}
                <li>
                  {/* **Đã đổi nội dung:** Nút xem thêm */}
                  <a href="/services" className="text-gray-400 hover:text-white transition-colors font-semibold">
                    Xem thêm
                  </a>
                </li>
              </ul>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold">Liên hệ</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-400">123 Đường ABC, Quận 1, TP.HCM</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-400">+84 123 456 789</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-400">support@homecare.vn</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}