import { Routes, Route, useNavigate } from "react-router-dom";
import { LoginPage } from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import ClientRoutes from "./ClientRoutes";
import TechnicianRegister from "../pages/Auth/TechnicianRegister";
import { GoogleCallbackPage } from "../pages/Auth/GoogleCallbackPage";
import AdminLayout from "../pages/admin/AdminLayout";
import AccountsPage from "../pages/admin/AccountsPage";
import TechniciansPage from "../pages/admin/TechniciansPage";
import Layout from "../layouts/Layout";
import { AddPasswordPage } from "../pages/Auth/AddPasswordPage";

export default function AppRoutes({
  loggedInUser,
  onLoginSuccess,
  onLogout,
  onPasswordSetSuccess,
}) {
  const navigate = useNavigate();

  const handleShowLogin = () => {
    navigate("/login");
  };

  const handleShowRegister = () => {
    navigate("/register");
  };

  const handleLogoutAndNavigate = () => {
    onLogout();
    setTimeout(() => {
      navigate("/");
    }, 0);
  };

  return (
    <Routes>
      <Route
        element={
          <Layout
            loggedInUser={loggedInUser}
            onLogout={handleLogoutAndNavigate}
            onShowLogin={handleShowLogin}
            onShowRegister={handleShowRegister}
          />
        }
      >
        <Route
          path="/*"
          element={
            <ClientRoutes
              loggedInUser={loggedInUser}
              onLogout={handleLogoutAndNavigate}
              onShowLogin={handleShowLogin}
              onShowRegister={handleShowRegister}
            />
          }
        />
        <Route
          path="/technician-register"
          element={
            <TechnicianRegister
              loggedInUser={loggedInUser}
              onLogout={handleLogoutAndNavigate}
              onShowLogin={handleShowLogin}
              onShowRegister={handleShowRegister}
            />
          }
        />
      </Route>

      <Route
        path="/login"
        element={
          <LoginPage
            onSwitchToRegister={() => navigate("/register")}
            onBackToHome={() => navigate("/")}
            onLoginSuccess={onLoginSuccess}
            loggedInUser={loggedInUser}
          />
        }
      />
      <Route
        path="/register"
        element={
          <RegisterPage
            onSwitchToLogin={() => navigate("/login")}
            onBackToHome={() => navigate("/")}
            loggedInUser={loggedInUser}
          />
        }
      />
      <Route
        path="/google-callback"
        element={<GoogleCallbackPage onLoginSuccess={onLoginSuccess} />}
      />

      <Route
        path="/add-password"
        element={
          <AddPasswordPage onPasswordSetSuccess={onPasswordSetSuccess} />
        }
      />
      <Route
        path="/admin"
        element={<AdminLayout loggedInUser={loggedInUser} />}
      >
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="technicians" element={<TechniciansPage />} />
      </Route>
    </Routes>
  );
}
