// src/routes/AppRoutes.jsx
import { Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react"; 
import { LoginPage } from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import ClientRoutes from "./ClientRoutes";
import TechnicianRegister from "../pages/Auth/TechnicianRegister";

export default function AppRoutes({ loggedInUser, onLoginSuccess, onLogout }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (loggedInUser) {
      navigate("/");
    }
  }, [loggedInUser, navigate]); 

  const handleShowLogin = () => {
    navigate("/login");
  };

  const handleShowRegister = () => {
    navigate("/register");
  };

  return (
    <Routes>
      {/* Sử dụng ClientRoutes để quản lý các routes client */}
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

      {/* Login */}
      <Route
        path="/login"
        element={
          <LoginPage
            onSwitchToRegister={() => navigate("/register")}
            onBackToHome={() => navigate("/")}
            onLoginSuccess={onLoginSuccess}
          />
        }
      />

      {/* Register */}
      <Route
        path="/register"
        element={
          <RegisterPage
            onSwitchToLogin={() => navigate("/login")}
            onBackToHome={() => navigate("/")}
          />
        }
      />

      {/* Technician Register */}
      <Route path="/technician-register" element={<TechnicianRegister />} />
    </Routes>
  );
}