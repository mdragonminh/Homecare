import { Home, LogIn, UserPlus, LogOut, User, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Header({ onShowLogin, onShowRegister, loggedInUser, onLogout }) {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Brand */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg text-gray-800">
              HomeServicePlatform
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button onClick={() => navigate("/")} className="text-gray-700 hover:text-blue-600 transition-colors">
              Trang chủ
            </button>
            <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
              Dịch vụ
            </a>
            <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
              Về chúng tôi
            </a>
            <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
              Liên hệ
            </a>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            {loggedInUser ? (
              // Nếu người dùng đã đăng nhập
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Xin chào, <span className="font-semibold ml-1">{loggedInUser.name || loggedInUser.fullName || loggedInUser.email}</span>
                </span>
                <button
                  onClick={onLogout}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </button>
              </div>
            ) : (
              // Nếu chưa đăng nhập
              <>
                <button
                  onClick={onShowLogin}
                  className="hidden sm:flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Đăng nhập
                </button>
                <button
                  onClick={onShowRegister}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Đăng ký
                </button>
                {/* Nút Tham gia kỹ thuật viên */}
                <button
                  onClick={() => navigate("/technician-register")}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Tham gia kỹ thuật viên
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
