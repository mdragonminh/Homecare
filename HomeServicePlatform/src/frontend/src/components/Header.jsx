import React from "react";
import { Home, Menu, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthButtons } from "./AuthButtons";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

export function Header({
  onShowLogin,
  onShowRegister,
  loggedInUser,
  onLogout,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo + Brand - Improved with gradient and hover effects */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-800 group-hover:text-blue-600 transition-colors">
              {t("app.name")}
            </span>
          </div>

          {/* Desktop Navigation - Enhanced with hover states */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
            >
              {t("nav.home")}
            </button>
            {loggedInUser?.role !== "technician" && (
              <button
                onClick={() => navigate("/services")}
                className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
              >
                {t("nav.services")}
              </button>
            )}
            {loggedInUser && loggedInUser.role === "customer" && (
              <>
                <button
                  onClick={() => navigate("/my-bookings")}
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium flex items-center space-x-2"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Booking của tôi</span>
                </button>
                <button
                  onClick={() => navigate("/chat")}
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
                >
                  Chat
                </button>
              </>
            )}
            <a
              href="/about"
              className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
            >
              {t("nav.about_us")}
            </a>
            <a
              href="/contact"
              className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
            >
              {t("nav.contact")}
            </a>
          </nav>

          {/* Right Section: Language + Auth + Mobile Menu */}
          <div className="flex items-center space-x-3">
            {/* Language Switcher - Hide on small screens */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* Auth Buttons - Desktop only */}
            <div className="hidden md:block">
              <AuthButtons
                loggedInUser={loggedInUser}
                onShowLogin={onShowLogin}
                onShowRegister={onShowRegister}
                onLogout={onLogout}
                navigate={navigate}
              />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-1 mb-4">
              <button
                onClick={() => {
                  navigate("/");
                  setMobileMenuOpen(false);
                }}
                className="px-4 py-3 text-left text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium"
              >
                {t("nav.home")}
              </button>
              {loggedInUser?.role !== "technician" && (
                <a
                  href="/services"
                  className="px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("nav.services")}
                </a>
              )}
              {loggedInUser && loggedInUser.role === "customer" && (
                <>
                  <button
                    onClick={() => {
                      navigate("/my-bookings");
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-3 text-left text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium flex items-center space-x-2"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Booking của tôi</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate("/chat");
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-3 text-left text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium"
                  >
                    Chat
                  </button>
                </>
              )}
              <a
                href="/about"
                className="px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.about_us")}
              </a>
              <a
                href="/contact"
                className="px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.contact")}
              </a>
            </nav>

            {/* Mobile Language Switcher */}
            <div className="sm:hidden mb-3 px-4">
              <LanguageSwitcher />
            </div>

            {/* Mobile Auth Buttons */}
            <div className="px-4 pt-3 border-t border-gray-100">
              <AuthButtons
                loggedInUser={loggedInUser}
                onShowLogin={onShowLogin}
                onShowRegister={onShowRegister}
                onLogout={onLogout}
                navigate={navigate}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
