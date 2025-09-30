// src/routes/AppRoutes.jsx
import { Routes, Route, useNavigate } from "react-router-dom";
import { LoginPage } from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import ClientRoutes from "./ClientRoutes";
import TechnicianRegister from "../pages/Auth/TechnicianRegister";
import { GoogleCallbackPage } from "../pages/Auth/GoogleCallbackPage";
import AdminLayout from "../pages/admin/AdminLayout";
import AccountsPage from "../pages/admin/AccountsPage";
import TechniciansPage from "../pages/admin/TechniciansPage";

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
      {/* Client routes */}
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
      {/* Auth */}
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

      <Route
        path="/google-callback"
        element={<GoogleCallbackPage onLoginSuccess={onLoginSuccess} />}
      />

      <Route
        path="/technician-register"
        element={
          <TechnicianRegister
            loggedInUser={loggedInUser}
            onLogout={onLogout}
            onShowLogin={handleShowLogin}
            onShowRegister={handleShowRegister}
          />
        }
      />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout loggedInUser={loggedInUser} />}>
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="technicians" element={<TechniciansPage />} />
      </Route>
    </Routes>
  );
}
