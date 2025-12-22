import React from "react";
import { Home, Menu, ClipboardList, MessageCircle, Briefcase, LayoutGrid } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthButtons } from "./AuthButtons";
import { useTranslation } from "react-i18next";

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

  /* Hiệu ứng di chuyển chuột cho background động */
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

  // Style cho từng mục trong Floating Dock
  const dockItemClass =
    "flex items-center gap-2 px-4 py-2 font-bold text-gray-800 " +
    "transition-all duration-300 rounded-xl " +
    "hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 " +
    "hover:scale-110 hover:-translate-y-0.5 active:scale-95";

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
        <div className="flex items-center h-20 justify-between">
          
          {/* LOGO - Cố định bên trái */}
          <div
            className="flex items-center space-x-3 cursor-pointer group shrink-0 w-1/4"
            onClick={() => navigate("/")}
          >
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-blue-400/50 group-hover:rotate-3 transition-all duration-300">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="hidden lg:block font-extrabold text-2xl text-blue-700 group-hover:text-blue-600 transition-colors duration-300 tracking-tight">
              {t("app.name")}
            </span>
          </div>

          {/* FLOATING DOCK - Căn giữa tuyệt đối */}
          <nav className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center space-x-1 bg-white/30 backdrop-blur-md p-1.5 rounded-2xl border border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
              {/* Nút Trang chủ */}
              <button onClick={() => navigate("/")} className={dockItemClass}>
                <LayoutGrid className="w-4 h-4" />
                <span className="text-sm">{t("nav.home")}</span>
              </button>

              {/* Nút Dịch vụ */}
              {loggedInUser?.role !== "technician" &&
                loggedInUser?.role !== "supporter" &&
                loggedInUser?.role !== "equipmentmanager" && (
                  <button onClick={() => navigate("/services")} className={dockItemClass}>
                    <Briefcase className="w-4 h-4" />
                    <span className="text-sm">{t("nav.services")}</span>
                  </button>
                )}

              {/* Nút dành cho Customer */}
              {loggedInUser?.role === "customer" && (
                <>
                  <button onClick={() => navigate("/my-bookings")} className={dockItemClass}>
                    <ClipboardList className="w-4 h-4" />
                    <span className="text-sm">Booking của tôi</span>
                  </button>

                  <button onClick={() => navigate("/chat")} className={dockItemClass}>
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">Chat</span>
                  </button>
                </>
              )}
            </div>
          </nav>

          {/* RIGHT ACTIONS - Cố định bên phải */}
          <div className="flex items-center justify-end space-x-4 shrink-0 w-1/4">
            <div className="hidden md:block">
              <AuthButtons
                loggedInUser={loggedInUser}
                onShowLogin={onShowLogin}
                onShowRegister={onShowRegister}
                onLogout={onLogout}
                navigate={navigate}
                isMobile={false}
              />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-800 bg-white/60 backdrop-blur-md hover:bg-white transition-all rounded-xl shadow-sm"
              aria-label="Toggle menu"
            >
              <Menu className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-4 right-4 bg-white/95 backdrop-blur-2xl animate-slideIn shadow-2xl overflow-hidden rounded-2xl border border-gray-100">
            <div className="px-4 pt-6 pb-4 border-b border-gray-100">
              <AuthButtons
                loggedInUser={loggedInUser}
                onShowLogin={() => { onShowLogin(); setMobileMenuOpen(false); }}
                onShowRegister={() => { onShowRegister(); setMobileMenuOpen(false); }}
                onLogout={() => { onLogout(); setMobileMenuOpen(false); }}
                navigate={navigate}
                isMobile={true}
              />
            </div>

            <nav className="flex flex-col space-y-2 px-4 py-6">
              <button
                onClick={() => { navigate("/"); setMobileMenuOpen(false); }}
                className="flex items-center space-x-3 w-full px-5 py-3 text-gray-900 bg-gray-50 rounded-xl font-semibold active:scale-95 transition-all"
              >
                <Home className="w-5 h-5" />
                <span>{t("nav.home")}</span>
              </button>

              {loggedInUser?.role !== "technician" && (
                <button
                  onClick={() => { navigate("/services"); setMobileMenuOpen(false); }}
                  className="flex items-center space-x-3 w-full px-5 py-3 text-gray-900 bg-gray-50 rounded-xl font-semibold active:scale-95 transition-all"
                >
                  <Briefcase className="w-5 h-5" />
                  <span>{t("nav.services")}</span>
                </button>
              )}

              {loggedInUser?.role === "customer" && (
                <>
                  <button
                    onClick={() => { navigate("/my-bookings"); setMobileMenuOpen(false); }}
                    className="flex items-center space-x-3 w-full px-5 py-3 text-gray-900 bg-gray-50 rounded-xl font-semibold active:scale-95 transition-all"
                  >
                    <ClipboardList className="w-5 h-5" />
                    <span>Booking của tôi</span>
                  </button>
                  <button
                    onClick={() => { navigate("/chat"); setMobileMenuOpen(false); }}
                    className="flex items-center space-x-3 w-full px-5 py-3 text-gray-900 bg-gray-50 rounded-xl font-semibold active:scale-95 transition-all"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Chat</span>
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}