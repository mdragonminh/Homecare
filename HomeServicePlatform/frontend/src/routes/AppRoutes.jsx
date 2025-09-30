// src/routes/AppRoutes.jsx
import { Routes, Route, useNavigate } from "react-router-dom";
import { LoginPage } from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import ClientRoutes from "./ClientRoutes";
import TechnicianRegister from "../pages/Auth/TechnicianRegister";
import { GoogleCallbackPage } from "../pages/Auth/GoogleCallbackPage";

export default function AppRoutes({ loggedInUser, onLoginSuccess, onLogout }) {
  const navigate = useNavigate();


  const handleShowLogin = () => {
    navigate("/login");
  };

  const handleShowRegister = () => {
    navigate("/register");
  };

   return (
    <Routes>
      {/* ClientRoutes */}
      <Route
        path="/*"
        element={
          <ClientRoutes 
            loggedInUser={loggedInUser}
            onLogout={onLogout}
            onShowLogin={handleShowLogin}
            onShowRegister={handleShowRegister}
          />
        }
      />

      {/* Login - THAY ĐỔI Ở ĐÂY */}
      <Route
        path="/login"
        element={
          <LoginPage
            onSwitchToRegister={() => navigate("/register")}
            onBackToHome={() => navigate("/")}
            onLoginSuccess={onLoginSuccess}
            loggedInUser={loggedInUser} // <-- THÊM PROP NÀY
          />
        }
      />

      {/* Register - Có thể thêm cho RegisterPage nếu cần */}
      <Route
        path="/register"
        element={
          <RegisterPage
            onSwitchToLogin={() => navigate("/login")}
            onBackToHome={() => navigate("/")}
            loggedInUser={loggedInUser} // <-- THÊM PROP NÀY
          />
        }
      />
      
      {/* Google Callback */}
      <Route
        path="/google-callback"
        element={<GoogleCallbackPage onLoginSuccess={onLoginSuccess} />}
      />

      {/* Technician Register */}
      <Route path="/technician-register" element={<TechnicianRegister loggedInUser={loggedInUser}/>} />
    </Routes>
  );
}