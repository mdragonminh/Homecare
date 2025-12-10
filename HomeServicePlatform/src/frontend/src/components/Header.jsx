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
  const headerRef = React.useRef(null);

  // Mouse move effect for dynamic background
  React.useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const handleMouseMove = (e) => {
      const rect = header.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      header.style.setProperty("--mouse-x", `${x}px`);
      header.style.setProperty("--mouse-y", `${y}px`);
    };

    header.addEventListener("mousemove", handleMouseMove);
    return () => header.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <header
      ref={headerRef}
      className="animate-gradient-header bg-[length:200%_200%] sticky top-0 z-50 shadow-lg border-b border-white/10 text-white"
      style={{
        backgroundImage: `
      radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.15), transparent 40%),
      linear-gradient(to right, #bfdbfe, #93c5fd, #3b82f6)
    `,
      }}
    >
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo + Brand - Enhanced with vibrant gradient */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl text-gray-900 group-hover:text-blue-500 transition-colors duration-300 tracking-tight">
              {t("app.name")}
            </span>
          </div>

          {/* Desktop Navigation - Modernized with glassmorphism buttons */}
          <nav className="hidden md:flex items-center space-x-2">
            <button
              onClick={() => navigate("/")}
              className="px-5 py-2.5 text-gray-800 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 rounded-xl transition-all duration-300 font-semibold bg-white/50 backdrop-blur-md shadow-sm hover:shadow-md"
            >
              {t("nav.home")}
            </button>
            {loggedInUser?.role !== "technician" &&
              loggedInUser?.role !== "supporter" &&
              loggedInUser?.role !== "equipmentmanager" && (
                <button
                  onClick={() => navigate("/services")}
                  className="px-5 py-2.5 text-gray-800 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 rounded-xl transition-all duration-300 font-semibold bg-white/50 backdrop-blur-md shadow-sm hover:shadow-md"
                >
                  {t("nav.services")}
                </button>
              )}
            {loggedInUser && loggedInUser.role === "customer" && (
              <>
                <button
                  onClick={() => navigate("/my-bookings")}
                  className="px-5 py-2.5 text-gray-800 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 rounded-xl transition-all duration-300 font-semibold bg-white/50 backdrop-blur-md shadow-sm hover:shadow-md flex items-center space-x-2"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Booking của tôi</span>
                </button>
                <button
                  onClick={() => navigate("/chat")}
                  className="px-5 py-2.5 text-gray-800 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 rounded-xl transition-all duration-300 font-semibold bg-white/50 backdrop-blur-md shadow-sm hover:shadow-md"
                >
                  Chat
                </button>
              </>
            )}
            <a
              href="/about"
              className="px-5 py-2.5 text-gray-800 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 rounded-xl transition-all duration-300 font-semibold bg-white/50 backdrop-blur-md shadow-sm hover:shadow-md"
            >
              {t("nav.about_us")}
            </a>
            <a
              href="/contact"
              className="px-5 py-2.5 text-gray-800 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 rounded-xl transition-all duration-300 font-semibold bg-white/50 backdrop-blur-md shadow-sm hover:shadow-md"
            >
              {t("nav.contact")}
            </a>
          </nav>

          {/* Right Section: Language + Auth + Mobile Menu */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher - Enhanced styling */}
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

            {/* Mobile Menu Button - Modernized */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-800 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 rounded-xl transition-all duration-300 bg-white/50 backdrop-blur-md shadow-sm"
              aria-label="Toggle menu"
            >
              <Menu className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown - Optimized for spacing */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-white/20 animate-slideIn rounded-b-2xl shadow-lg overflow-y-auto max-h-[80vh]">
            <nav className="flex flex-col space-y-3 px-4 py-6">
              <button
                onClick={() => {
                  navigate("/");
                  setMobileMenuOpen(false);
                }}
                className="w-full px-5 py-3 text-left !text-gray-900 bg-white/80 rounded-xl shadow-sm hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:!text-white transition-all duration-300 font-semibold"
              >
                {t("nav.home")}
              </button>

              {loggedInUser?.role !== "technician" && (
                <a
                  href="/services"
                  className="w-full px-5 py-3 text-left !text-gray-900 bg-white/80 rounded-xl shadow-sm hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:!text-white transition-all duration-300 font-semibold"
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
                    className="w-full px-5 py-3 text-left !text-gray-900 bg-white/80 rounded-xl shadow-sm hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:!text-white transition-all duration-300 font-semibold flex items-center space-x-2"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Booking của tôi</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate("/chat");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-5 py-3 text-left !text-gray-900 bg-white/80 rounded-xl shadow-sm hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:!text-white transition-all duration-300 font-semibold"
                  >
                    Chat
                  </button>
                </>
              )}

              <a
                href="/about"
                className="w-full px-5 py-3 text-left !text-gray-900 bg-white/80 rounded-xl shadow-sm hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:!text-white transition-all duration-300 font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.about_us")}
              </a>

              <a
                href="/contact"
                className="w-full px-5 py-3 text-left !text-gray-900 bg-white/80 rounded-xl shadow-sm hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:!text-white transition-all duration-300 font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.contact")}
              </a>
            </nav>

            {/* Language Switcher Mobile */}
            <div className="px-4 pb-4">
              <LanguageSwitcher />
            </div>

            {/* Auth Buttons Mobile */}
            <div className="px-4 pb-6 border-t border-white/30 pt-4">
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
