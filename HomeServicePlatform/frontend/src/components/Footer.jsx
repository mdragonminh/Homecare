import { Home, Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from "lucide-react";

export function Footer() {
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
              <span className="font-semibold text-lg">HomeCare Manager</span>
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
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Trang chủ</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Dịch vụ</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Về chúng tôi</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Hỗ trợ</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Điều khoản</a></li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-semibold">Dịch vụ</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Sửa chữa điện</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Sửa chữa nước</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Làm sạch</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Bảo trì máy lạnh</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Xem tất cả</a></li>
            </ul>
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

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-12 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © 2024 HomeCare Manager. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
