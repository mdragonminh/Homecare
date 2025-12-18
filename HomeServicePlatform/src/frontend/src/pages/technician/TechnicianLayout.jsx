import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  ChatBubbleLeftRightIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { UserCircleIcon } from "lucide-react";

const TechnicianLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("user");
    navigate("/auth/login");
  };

  const navigationItems = [
    {
      name: "Quản lý Booking",
      href: "/technician/bookings",
      icon: ClipboardDocumentListIcon,
      end: false,
    },
    {
      name: "Chat",
      href: "/technician/chat",
      icon: ChatBubbleLeftRightIcon,
      end: false,
    },
  ];

  const handleGoHome = () => {
    navigate("/");
  };
  
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* 👈 Container cho Mobile Header và Dropdown Menu */}
      <div className="lg:hidden sticky top-0 z-50">
        
        {/* 1. Mobile Header (Luôn hiển thị) */}
        <header className="bg-white shadow-md">
          <div className="flex items-center justify-between h-16 px-4">
            <h1 className="text-xl font-bold text-indigo-600">
              HSP Technician
            </h1>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-500 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </header>

        {/* 2. Mobile Dropdown Menu (Đổ xuống) */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out bg-white shadow-lg ${
            isMenuOpen ? 'max-h-screen border-t border-gray-200' : 'max-h-0' // 👈 Điều khiển đổ xuống
          }`}
        >
          <div className="flex flex-col">
            {/* Navigation */}
            <nav className="flex-1 px-4 py-3 space-y-1">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.end}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-indigo-100 text-indigo-700 border-l-2 border-indigo-500" // Thay border-r-2 bằng border-l-2
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </NavLink>
              ))}
            </nav>

            {/* User info & Logout */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center mb-4">
                <UserCircleIcon className="w-8 h-8 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {JSON.parse(localStorage.getItem("user") || "{}")?.fullName ||
                      "Kỹ thuật viên"}
                  </p>
                  <p className="text-xs text-gray-500">Technician</p>
                </div>
              </div>
              <button
                onClick={() => {
                  handleGoHome();
                  closeMenu();
                }}
                className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors mb-2"
              >
                <HomeIcon className="w-5 h-5 mr-3" />
                Quay lại Home
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden lg:block fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-indigo-600">
              HSP Technician
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-indigo-100 text-indigo-700 border-r-2 border-indigo-500"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User info & Logout */}
          <div className="border-t border-gray-200 p-4">
            {/* ... Giữ nguyên phần UserCircleIcon và thông tin người dùng ... */}
             <div className="flex items-center mb-4">
              <UserCircleIcon className="w-8 h-8 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {JSON.parse(localStorage.getItem("user") || "{}")?.fullName ||
                    "Kỹ thuật viên"}
                </p>
                <p className="text-xs text-gray-500">Technician</p>
              </div>
            </div>
            <button
              onClick={handleGoHome}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors mb-2"
            >
              <HomeIcon className="w-5 h-5 mr-3" />
              Quay lại Home
            </button>
            {/* <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
              Đăng xuất
            </button> */}
          </div>
        </div>
      </div>
      
      <div className="lg:pl-64"> 
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TechnicianLayout;