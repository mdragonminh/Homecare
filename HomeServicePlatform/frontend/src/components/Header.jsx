import { Home, LogIn, UserPlus, LogOut, User, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthButtons } from "./AuthButtons";

export function Header({ onShowLogin, onShowRegister, loggedInUser, onLogout }) {
  const navigate = useNavigate();
  console.log("Header loggedInUser:", loggedInUser);
  
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

          {/* Auth Buttons Component */}
          <div className="flex items-center space-x-3">
            <AuthButtons
              loggedInUser={loggedInUser}
              onShowLogin={onShowLogin}
              onShowRegister={onShowRegister}
              onLogout={onLogout}
              navigate={navigate}
            />
          </div>
        </div>
      </div>
    </header>
  );
}