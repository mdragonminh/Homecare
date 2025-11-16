import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom"; 
import { LoginPage } from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import ClientRoutes from "./ClientRoutes";
import TechnicianRegister from "../pages/Auth/TechnicianRegister";
import { GoogleCallbackPage } from "../pages/Auth/GoogleCallbackPage";
import AdminLayout from "../pages/admin/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminSettingsPage from "../pages/admin/AdminSettingsPage";
import AccountsPage from "../pages/admin/AccountsPage";
import HomeServicePage from "../pages/admin/HomeServicePage";
import AccountManagementPage from "../pages/admin/AccountManagementPage";
import ServiceManagementPage from "../pages/admin/ServiceManagementPage";
import PaymentManagementPage from "../pages/admin/PaymentManagementPage";
import OperatorLayout from "../pages/operator/OperatorLayout";
import OperatorCustomersPage from "../pages/operator/OperatorCustomersPage";
import OperatorTechniciansPage from "../pages/operator/OperatorTechniciansPage";
import OperatorSettingsPage from "../pages/operator/OperatorSettingsPage";
import Layout from "../layouts/Layout";
import { AddPasswordPage } from "../pages/Auth/AddPasswordPage";
import ResetPasswordPage from "../pages/Auth/ResetPasswordPage";
import ForgotPasswordPage from "../pages/Auth/ForgotPasswordPage";
import ConfirmEmailChangePage from "../pages/Auth/ConfirmEmailChangePage";
import EquipmentManagerLayout from "../pages/equipmentmanager/EquipmentManagerLayout";
import EquipmentManagerEquipmentPage from "../pages/equipmentmanager/EquipmentManagerEquipmentPage";
import EquipmentManagerWarehousePage from "../pages/equipmentmanager/EquipmentManagerWarehousePage";
import TechnicianLayout from "../pages/technician/TechnicianLayout";
import TechnicianBookingsPage from "../pages/technician/TechnicianBookingsPage";
import TechnicianChat from "../pages/technician/TechnicianChat";
import BookingDetailPage from "../pages/technician/BookingDetailPage";
import CustomerChat from "../pages/client/CustomerChat";

function ProtectedRoleLayout({ loggedInUser, allowedRoles, children }) {
  const location = useLocation();

  if (!loggedInUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(loggedInUser.role)) {
    return <Navigate to="/" replace />; 
  }

  return children;
};

export default function AppRoutes({
  loggedInUser,
  onLoginSuccess,
  onLogout,
  onPasswordSetSuccess,
  onProfileUpdate,
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
              onProfileUpdate={onProfileUpdate}
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

      {/* Customer Chat Route */}
      <Route
        path="/chat"
        element={
          <ProtectedRoleLayout 
            loggedInUser={loggedInUser} 
            allowedRoles={["customer"]}
          >
            <div className="min-h-screen">
              <CustomerChat />
            </div>
          </ProtectedRoleLayout>
        }
      />

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
      <Route
        path="/confirm-email-change"
        element={<ConfirmEmailChangePage />}
      />

      {/* ---- Admin ---- */}
      <Route
        element={
          <ProtectedRoleLayout
            loggedInUser={loggedInUser}
            allowedRoles={["admin"]}
          >
            <AdminLayout loggedInUser={loggedInUser} />
          </ProtectedRoleLayout>
        }
      >
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/accounts" element={<AccountsPage />} />
        <Route path="/admin/account-management" element={<AccountManagementPage />} />
        <Route path="/admin/technicians" element={<OperatorTechniciansPage />} />
        <Route path="/admin/home-services" element={<HomeServicePage />} />
        <Route path="/admin/service-management" element={<ServiceManagementPage />} />
        <Route path="/admin/payments" element={<PaymentManagementPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
      </Route>

      {/* ---- Operator & Supporter ---- */}
      <Route
        element={
          <ProtectedRoleLayout
            loggedInUser={loggedInUser}
            allowedRoles={["operator", "supporter"]}
          >
            <OperatorLayout loggedInUser={loggedInUser} />
          </ProtectedRoleLayout>
        }
      >
        <Route path="/operator" element={<Navigate to="/operator/customers" replace />} />
        <Route path="/operator/customers" element={<OperatorCustomersPage />} />
        <Route path="/operator/technicians" element={<OperatorTechniciansPage />} />
        <Route path="/operator/settings" element={<OperatorSettingsPage />} />
      </Route>

      {/* ---- Warehouse (Equipment Manager) ---- */}
      <Route
        element={
          <ProtectedRoleLayout
            loggedInUser={loggedInUser}
            allowedRoles={["equipmentmanager"]}
          >
            <EquipmentManagerLayout loggedInUser={loggedInUser} />
          </ProtectedRoleLayout>
        }
      >
        <Route path="/warehouse" element={<EquipmentManagerWarehousePage />} />
        <Route path="/warehouse/equipments" element={<EquipmentManagerEquipmentPage />} />
      </Route>

      {/* ---- Technician ---- */}
      <Route
        element={
          <ProtectedRoleLayout
            loggedInUser={loggedInUser}
            allowedRoles={["technician"]}
          >
            <TechnicianLayout loggedInUser={loggedInUser} />
          </ProtectedRoleLayout>
        }
      >
        <Route path="/technician" element={<Navigate to="/technician/bookings" replace />} />
        <Route path="/technician/bookings" element={<TechnicianBookingsPage />} />
        <Route path="/technician/bookings/:id" element={<BookingDetailPage />} />
        <Route path="/technician/chat" element={<TechnicianChat />} />
      </Route>

    </Routes>
  );
}