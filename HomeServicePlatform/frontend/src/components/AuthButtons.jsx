import { useState, useRef, useEffect } from "react";
import { LogIn, UserPlus, LogOut, User, Wrench, ChevronDown, Settings, UserCircle, MapPin } from "lucide-react";

export function AuthButtons({ loggedInUser, onShowLogin, onShowRegister, onLogout, navigate }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleLogoutClick = () => {
    onLogout();
    setIsDropdownOpen(false);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Button */}
      <button
        onClick={toggleDropdown}
        className="group flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
      >
        {loggedInUser ? (
          <>
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <UserCircle className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:inline font-semibold">
              {loggedInUser.name || "Tài khoản"}
            </span>
          </>
        ) : (
          <>
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Tài khoản</span>
          </>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-3 w-64 origin-top-right rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 border border-gray-100 transform transition-all duration-300 ease-out scale-95 animate-in zoom-in-95">
          <div className="p-2">
            {loggedInUser ? (
              // Logged In User Menu
              <>
                {/* User Info Header */}
                <div className="px-3 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl mb-2 border border-blue-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                      <UserCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate text-sm">
                        {loggedInUser.name || "Người dùng"}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {loggedInUser.email}
                      </p>
                      {loggedInUser.role && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                          {loggedInUser.role === 'customer' ? 'Khách hàng' : 
                            loggedInUser.role === 'technician' ? 'Kỹ thuật viên' : 
                            loggedInUser.role}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="space-y-1">
                  {loggedInUser.role === 'admin' && (
                    <button
                      onClick={() => handleNavigate('/admin/accounts')}
                      className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-gray-50 hover:text-blue-600 transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-2 group-hover:bg-blue-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d="M3 6a3 3 0 013-3h3a3 3 0 013 3v3a3 3 0 01-3 3H6a3 3 0 01-3-3V6zM12 6a3 3 0 013-3h3a3 3 0 013 3v3a3 3 0 01-3 3h-3a3 3 0 01-3-3V6zM3 15a3 3 0 013-3h3a3 3 0 013 3v3a3 3 0 01-3 3H6a3 3 0 01-3-3v-3zM12 15a3 3 0 013-3h3a3 3 0 013 3v3a3 3 0 01-3 3h-3a3 3 0 01-3-3v-3z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Admin Panel</div>
                        <div className="text-xs text-gray-500">Quản trị hệ thống</div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => handleNavigate('/profile')}
                    className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-gray-50 hover:text-blue-600 transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-2 group-hover:bg-blue-100 transition-colors">
                      <Settings className="w-4 h-4 group-hover:text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">Quản lý tài khoản</div>
                      <div className="text-xs text-gray-500">Thông tin cá nhân, cài đặt</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleNavigate('/list-home')}
                    className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-gray-50 hover:text-blue-600 transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-2 group-hover:bg-blue-100 transition-colors">
                      <MapPin className="w-4 h-4 group-hover:text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">Quản lý nhà</div>
                      <div className="text-xs text-gray-500">Thêm địa chỉ giao hàng mới</div>
                    </div>
                  </button>

                  <div className="h-px bg-gray-100 my-2"></div>

                  <button
                    onClick={handleLogoutClick}
                    className="flex items-center w-full px-3 py-2.5 text-sm text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-2 group-hover:bg-red-200 transition-colors">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">Đăng xuất</div>
                      <div className="text-xs text-red-400">Thoát khỏi tài khoản</div>
                    </div>
                  </button>
                </div>
              </>
            ) : (
              // Guest User Menu
              <>
                <div className="px-4 py-3 text-center border-b border-gray-100 mb-2">
                  <h3 className="font-bold text-gray-900 mb-1">Chào mừng bạn!</h3>
                  <p className="text-sm text-gray-600">Đăng nhập để trải nghiệm đầy đủ dịch vụ</p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      onShowLogin();
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-2.5 text-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg group"
                  >
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-2">
                      <LogIn className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Đăng nhập</div>
                      <div className="text-xs text-blue-100">Truy cập tài khoản của bạn</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onShowRegister();
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-gray-50 hover:text-green-600 transition-all duration-200 group border border-gray-200 hover:border-green-200"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-2 group-hover:bg-green-100 transition-colors">
                      <UserPlus className="w-4 h-4 group-hover:text-green-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">Đăng ký tài khoản</div>
                      <div className="text-xs text-gray-500 group-hover:text-green-400">Tạo tài khoản mới miễn phí</div>
                    </div>
                  </button>

                  <div className="h-px bg-gray-100 my-2"></div>

                  <button
                    onClick={() => handleNavigate("/technician-register")}
                    className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 group border border-dashed border-gray-300 hover:border-orange-300"
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-2 group-hover:bg-orange-200 transition-colors">
                      <Wrench className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">Trở thành kỹ thuật viên</div>
                      <div className="text-xs text-orange-500">Kiếm tiền từ kỹ năng của bạn</div>
                    </div>
                  </button>
                </div>

                <div className="px-4 py-3 text-center mt-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-600">
                    Bằng cách đăng ký, bạn đồng ý với 
                    <span className="text-blue-600 font-medium"> Điều khoản dịch vụ </span>
                    của chúng tôi
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}