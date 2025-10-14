import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import ClientRoutes from "./ClientRoutes";
import TechnicianRegister from "../pages/Auth/TechnicianRegister";
import { GoogleCallbackPage } from "../pages/Auth/GoogleCallbackPage";
import AdminLayout from "../pages/admin/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminSettingsPage from "../pages/admin/AdminSettingsPage";
import AccountsPage from "../pages/admin/AccountsPage";
import OperatorLayout from "../pages/operator/OperatorLayout";
import OperatorCustomersPage from "../pages/operator/OperatorCustomersPage";
import OperatorTechniciansPage from "../pages/operator/OperatorTechniciansPage";
import OperatorSettingsPage from "../pages/operator/OperatorSettingsPage";
import Layout from "../layouts/Layout";
import { AddPasswordPage } from "../pages/Auth/AddPasswordPage";
import ResetPasswordPage from "../pages/Auth/ResetPasswordPage";
import ForgotPasswordPage from "../pages/Auth/ForgotPasswordPage";

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

  const handleShowForgotPassword = () => {
    navigate("/forgot-password");
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

      {/* ---- Auth routes ---- */}
      <Route
        path="/login"
        element={
          loggedInUser ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage
              onSwitchToRegister={() => navigate("/register")}
              onSwitchToForgotPassword={handleShowForgotPassword}
              onBackToHome={() => navigate("/")}
              onLoginSuccess={onLoginSuccess}
              loggedInUser={loggedInUser}
            />
          )
        }
      />

      <Route
        path="/register"
        element={
          loggedInUser ? (
            <Navigate to="/" replace />
          ) : (
            <RegisterPage
              onSwitchToLogin={() => navigate("/login")}
              onBackToHome={() => navigate("/")}
              loggedInUser={loggedInUser}
            />
          )
        }
      />

      <Route
        path="/forgot-password"
        element={
          loggedInUser ? (
            <Navigate to="/" replace />
          ) : (
            <ForgotPasswordPage onSwitchToLogin={handleShowLogin} />
          )
        }
      />

      <Route
        path="/reset-password"
        element={
          loggedInUser ? <Navigate to="/" replace /> : <ResetPasswordPage />
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

      {/* ---- Admin ---- */}
      <Route
        path="/admin"
        element={<AdminLayout loggedInUser={loggedInUser} />}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* ---- Operator ---- */}
      <Route
        path="/operator"
        element={<OperatorLayout loggedInUser={loggedInUser} />}
      >
        <Route index element={<Navigate to="customers" replace />} />
        <Route path="customers" element={<OperatorCustomersPage />} />
        <Route path="technicians" element={<OperatorTechniciansPage />} />
        <Route path="settings" element={<OperatorSettingsPage />} />
      </Route>
    </Routes>
  );
}
