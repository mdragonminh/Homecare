import { useState, useRef, useEffect } from "react";
import {
  LogIn,
  UserPlus,
  LogOut,
  User,
  Wrench,
  ChevronDown,
  Settings,
  UserCircle,
  MapPin,
  Ticket, 
} from "lucide-react";
import { useTranslation } from "react-i18next";

export function AuthButtons({
  loggedInUser,
  onShowLogin,
  onShowRegister,
  onLogout,
  navigate,
}) {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
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
        className="group flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-blue-500/25 transform hover:scale-105"
      >
        {loggedInUser ? (
          <>
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <UserCircle className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:inline font-semibold">
              {loggedInUser.name || t("ui.account")}
            </span>
          </>
        ) : (
          <>
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{t("ui.account")}</span>
          </>
        )}
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-300 ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl bg-white shadow-2xl ring-1 ring-black/5 border border-gray-100 transform transition-all duration-300 ease-out scale-95 animate-in zoom-in-95">
          <div className="p-2">
            {loggedInUser ? (
              // Logged In User Menu
              <>
                {/* User Info Header */}
                <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-2 border border-blue-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                      <UserCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate text-sm">
                        {loggedInUser.name || t("ui.user")}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {loggedInUser.email}
                      </p>
                      {loggedInUser.role && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                          {loggedInUser.role === "customer"
                            ? t("ui.customer")
                            : loggedInUser.role === "technician"
                            ? t("ui.technician")
                            : loggedInUser.role === "equipmentmanager"
                            ? "Quản lý kho thiết bị"
                            : loggedInUser.role}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="space-y-1">
                  {loggedInUser.role === "admin" && (
                    <button
                      onClick={() => handleNavigate("/admin/dashboard")}
                      className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-gray-50 hover:text-blue-600 transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-2 group-hover:bg-blue-100 transition-colors">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path d="M3 6a3 3 0 013-3h3a3 3 0 013 3v3a3 3 0 01-3 3H6a3 3 0 01-3-3V6zM12 6a3 3 0 013-3h3a3 3 0 013 3v3a3 3 0 01-3 3h-3a3 3 0 01-3-3V6zM3 15a3 3 0 013-3h3a3 3 0 013 3v3a3 3 0 01-3 3H6a3 3 0 01-3-3v-3zM12 15a3 3 0 013-3h3a3 3 0 013 3v3a3 3 0 01-3 3h-3a3 3 0 01-3-3v-3z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Admin Panel</div>
                        <div className="text-xs text-gray-500">
                          Quản trị hệ thống
                        </div>
                      </div>
                    </button>
                  )}

                  {loggedInUser.role === "operator" && (
                    <button
                      onClick={() => handleNavigate("/operator/customers")}
                      className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-gray-50 hover:text-green-600 transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-2 group-hover:bg-green-100 transition-colors">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Operator Panel</div>
                        <div className="text-xs text-gray-500">
                          Quản lý vận hành
                        </div>
                      </div>
                    </button>
                  )}

                  {loggedInUser.role === "equipmentmanager" && (
                    <button
                      onClick={() => handleNavigate("/warehouse")}
                      className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-gray-50 hover:text-orange-600 transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-2 group-hover:bg-orange-100 transition-colors">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
                          <path
                            fillRule="evenodd"
                            d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zM12 10.5a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V12.75h-1.5a.75.75 0 010-1.5H12z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Warehouse Manager</div>
                        <div className="text-xs text-gray-500">
                          Quản lý kho thiết bị
                        </div>
                      </div>
                    </button>
                  )}

                  {loggedInUser.role === "technician" && (
                    <button
                      onClick={() => handleNavigate("/technician")}
                      className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-gray-50 hover:text-purple-600 transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-2 group-hover:bg-purple-100 transition-colors">
                        <Wrench className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Technician Panel</div>
                        <div className="text-xs text-gray-500">
                          Quản lý booking
                        </div>
                      </div>
                    </button>
                  )}

                  {loggedInUser.role === "supporter" && (
                    <button
                      onClick={() => handleNavigate("/supporter/tickets")}
                      className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2 group-hover:bg-blue-200 transition-colors">
                        <Ticket className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">
                          {t("ui.ticket_management")}
                        </div>
                        <div className="text-xs text-blue-500">
                          {t("ui.ticket_management_desc")}
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => handleNavigate("/profile")}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-purple-50 hover:text-purple-600 transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-2 group-hover:bg-purple-200 transition-colors">
                      <Settings className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">
                        {t("ui.manage_account")}
                      </div>
                      <div className="text-xs text-purple-500">
                        {t("ui.personal_info_settings")}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleNavigate("/list-home")}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-green-50 hover:text-green-600 transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-2 group-hover:bg-green-200 transition-colors">
                      <MapPin className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{t("ui.manage_homes")}</div>
                      <div className="text-xs text-green-500">
                        {t("ui.add_new_delivery_address")}
                      </div>
                    </div>
                  </button>

                  <div className="h-px bg-gray-100 my-2"></div>

                  <button
                    onClick={handleLogoutClick}
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-2 group-hover:bg-red-200 transition-colors">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{t("ui.logout")}</div>
                      <div className="text-xs text-red-400">
                        {t("ui.exit_account")}
                      </div>
                    </div>
                  </button>
                </div>
              </>
            ) : (
              // Guest User Menu
              <>
                <div className="px-3 py-2 text-center border-b border-gray-100 mb-2">
                  <h3 className="font-bold text-gray-900 mb-1">
                    {t("ui.welcome")}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t("ui.login_to_experience")}
                  </p>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => {
                      onShowLogin();
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg group"
                  >
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-2">
                      <LogIn className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">
                        {t("ui.login_button")}
                      </div>
                      <div className="text-xs text-blue-100">
                        {t("ui.access_account")}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onShowRegister();
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 hover:text-green-600 transition-all duration-200 group border border-gray-200 hover:border-green-200"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-2 group-hover:bg-green-100 transition-colors">
                      <UserPlus className="w-4 h-4 group-hover:text-green-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">
                        {t("ui.register_account")}
                      </div>
                      <div className="text-xs text-gray-500 group-hover:text-green-400">
                        {t("ui.create_free_account")}
                      </div>
                    </div>
                  </button>

                  <div className="h-px bg-gray-100 my-2"></div>

                  <button
                    onClick={() => handleNavigate("/technician-register")}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 group border border-dashed border-gray-300 hover:border-orange-300"
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-2 group-hover:bg-orange-200 transition-colors">
                      <Wrench className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">
                        {t("ui.become_technician")}
                      </div>
                      <div className="text-xs text-orange-500">
                        {t("ui.earn_with_skills")}
                      </div>
                    </div>
                  </button>
                </div>

                <div className="px-3 py-2 text-center mt-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">
                    {t("ui.by_registering")}{" "}
                    <span className="text-blue-600 font-medium">
                      {t("ui.terms_of_service")}
                    </span>{" "}
                    {t("ui.of_our_service")}
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
