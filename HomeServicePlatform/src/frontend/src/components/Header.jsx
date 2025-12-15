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

  /* Mouse move effect for dynamic background */
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

  const buttonClass =
  "px-4 py-2 font-semibold text-gray-800 relative " +
  "transition-all duration-300 rounded-xl " +
  "hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:shadow-md";


  return (
    <header
      ref={headerRef}
      className="header-glass-fix animate-gradient-header bg-[length:200%_200%] sticky top-0 z-50 shadow-lg border-b border-white/10 text-white"
      style={{
        backgroundImage: `
          radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.15), transparent 40%),
          linear-gradient(to right, #bfdbfe, #93c5fd, #3b82f6)
        `,
      }}
    >
      <div className="container mx-auto px-4 lg:px-6">
        {/* ===== HEADER LAYOUT ===== */}
        <div className="relative flex items-center h-20">
          {/* LOGO */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl text-blue-600 group-hover:text-blue-500 transition-colors duration-300 tracking-tight">
              {t("app.name")}
            </span>
          </div>

          {/* NAV – CENTER ABSOLUTE */}
          <nav className="hidden md:flex items-center space-x-2 absolute left-1/2 -translate-x-1/2">
            <button onClick={() => navigate("/")} className={buttonClass}>
              {t("nav.home")}
            </button>

            {loggedInUser?.role !== "technician" &&
              loggedInUser?.role !== "supporter" &&
              loggedInUser?.role !== "equipmentmanager" && (
                <button
                  onClick={() => navigate("/services")}
                  className={buttonClass}
                >
                  {t("nav.services")}
                </button>
              )}

            {loggedInUser?.role === "customer" && (
              <>
                <button
                  onClick={() => navigate("/my-bookings")}
                  className={`${buttonClass} flex items-center space-x-2`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Booking của tôi</span>
                </button>

                <button
                  onClick={() => navigate("/chat")}
                  className={buttonClass}
                >
                  Chat
                </button>
              </>
            )}

            <button
              onClick={() => navigate("/about")}
              className={buttonClass}
            >
              {t("nav.about_us")}
            </button>

            <button
              onClick={() => navigate("/contact")}
              className={buttonClass}
            >
              {t("nav.contact")}
            </button>
          </nav>

          {/* RIGHT SECTION */}
          <div className="ml-auto flex items-center space-x-4">
            {/* AUTH DESKTOP */}
            <div className="hidden md:block">
              <AuthButtons
                loggedInUser={loggedInUser}
                onShowLogin={onShowLogin}
                onShowRegister={onShowRegister}
                onLogout={onLogout}
                navigate={navigate}
              />
            </div>

            {/* MOBILE MENU BUTTON */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-800 bg-white/60 backdrop-blur-md relative overflow-hidden hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 rounded-xl transition-all duration-300 shadow-sm"
              aria-label="Toggle menu"
            >
              <Menu className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* ===== MOBILE MENU ===== */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-white/20 animate-slideIn rounded-b-2xl shadow-lg overflow-y-auto max-h-[80vh]">
            <nav className="flex flex-col space-y-3 px-4 py-6">
              <button
                onClick={() => {
                  navigate("/");
                  setMobileMenuOpen(false);
                }}
                className="w-full px-5 py-3 text-left text-gray-900 bg-white/80 rounded-xl shadow-sm hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white transition-all duration-300 font-semibold"
              >
                {t("nav.home")}
              </button>

              {loggedInUser?.role !== "technician" && (
                <button
                  onClick={() => {
                    navigate("/services");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-5 py-3 text-left text-gray-900 bg-white/80 rounded-xl shadow-sm hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white transition-all duration-300 font-semibold"
                >
                  {t("nav.services")}
                </button>
              )}

              {loggedInUser?.role === "customer" && (
                <>
                  <button
                    onClick={() => {
                      navigate("/my-bookings");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-5 py-3 text-left text-gray-900 bg-white/80 rounded-xl shadow-sm hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white transition-all duration-300 font-semibold flex items-center space-x-2"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Booking của tôi</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate("/chat");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-5 py-3 text-left text-gray-900 bg-white/80 rounded-xl shadow-sm hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white transition-all duration-300 font-semibold"
                  >
                    Chat
                  </button>
                </>
              )}
            </nav>

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
