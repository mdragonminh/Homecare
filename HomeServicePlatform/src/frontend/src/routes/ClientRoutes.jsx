import { Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "../pages/client/HomePage";
import { AboutPage } from "../pages/client/AboutPage";
import { ContactPage } from "../pages/client/ContactPage";
import HomeManagementPage from "../pages/client/home/HomeManagementPage";
import HomeItemsPage from "../pages/client/home/HomeItemsPage";
import Profile from "../pages/Profile";
import { jwtDecode } from "jwt-decode";
import { FindTechnicianPage } from "../pages/client/service/FindTechnicianPage";
import CustomerBookingsPage from "../pages/client/CustomerBookingsPage";
import PaymentPage from "../pages/client/payment/PaymentPage";
import PaymentInstructionsPage from "../pages/client/payment/PaymentInstructionsPage";
import PaymentResultPage from "../pages/client/payment/PaymentResultPage";
import CustomerBookingDetail from "../pages/client/CustomerBookingDetail";
import TechnicianProfile from "../pages/TechnicianProfile";
import TicketManagementPage from "../pages/supporter/TicketManagementPage";

// Component này chỉ dùng để bảo vệ các trang BẮT BUỘC ĐĂNG NHẬP
const ProtectedRoute = ({
  element: Element,
  loggedInUser,
  disallowedRoles = [],
}) => {
  if (!loggedInUser) {
    return <Navigate to="/login" replace />;
  }
  if (
    disallowedRoles.length > 0 &&
    disallowedRoles.includes(loggedInUser.role)
  ) {
    return <Navigate to="/" replace />; 
  }
  return Element;
};

const SupporterRoute = ({ element: Element, loggedInUser }) => {
  if (!loggedInUser) {
    return <Navigate to="/login" replace />;
  }

  if (loggedInUser.role !== "supporter") {
    return <Navigate to="/" replace />;
  }

  return Element;
};

// Component cho Trang chủ (Không đổi)
const ProtectedHomePage = ({ element: Element, loggedInUser }) => {
  if (loggedInUser) {
    try {
      const decoded = jwtDecode(loggedInUser.jwtToken);
      const requirePasswordSetup = decoded.requirePasswordSetup || false;
      if (requirePasswordSetup) {
        return <Navigate to="/add-password" replace />;
      }
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }
  return Element;
};

export default function ClientRoutes({
  loggedInUser,
  onLogout,
  onShowLogin,
  onShowRegister,
  onProfileUpdate,
}) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedHomePage
            loggedInUser={loggedInUser}
            element={
              <HomePage
                loggedInUser={loggedInUser}
                onShowRegister={onShowRegister}
              />
            }
          />
        }
      />

      {/* CÁC ROUTE BẢO VỆ BẮT BUỘC ĐĂNG NHẬP */}
      <Route
        path="/list-home"
        element={
          <ProtectedRoute
            loggedInUser={loggedInUser}
            disallowedRoles={["technician"]} // cấm technician
            element={<HomeManagementPage loggedInUser={loggedInUser} />}
          />
        }
      />
      <Route
        path="/home-items/:homeId"
        element={
          <ProtectedRoute
            loggedInUser={loggedInUser}
            element={<HomeItemsPage loggedInUser={loggedInUser} />}
          />
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute
            loggedInUser={loggedInUser}
            element={
              loggedInUser && loggedInUser.role === "technician" ? (
                <TechnicianProfile
                  loggedInUser={loggedInUser}
                  onLogout={onLogout}
                  onShowLogin={onShowLogin}
                  onShowRegister={onShowRegister}
                  onProfileUpdate={onProfileUpdate}
                />
              ) : (
                // NẾU LÀ CUSTOMER/ADMIN/VAI TRÒ KHÁC, RENDER Profile CHUNG
                <Profile
                  loggedInUser={loggedInUser}
                  onLogout={onLogout}
                  onShowLogin={onShowLogin}
                  onShowRegister={onShowRegister}
                  onProfileUpdate={onProfileUpdate}
                />
              )
            }
          />
        }
      />

      <Route
        path="/about"
        element={
          <AboutPage
            loggedInUser={loggedInUser}
            onShowLogin={onShowLogin}
            onShowRegister={onShowRegister}
          />
        }
      />

      <Route
        path="/contact"
        element={<ContactPage loggedInUser={loggedInUser} />}
      />
      <Route
        path="/services"
        element={
          loggedInUser && loggedInUser.role === "technician" ? (
            <Navigate to="/" replace />
          ) : (
            <FindTechnicianPage loggedInUser={loggedInUser} />
          )
        }
      />

      {/* Customer Bookings (Bảo vệ) */}
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute
            loggedInUser={loggedInUser}
            element={<CustomerBookingsPage />}
          />
        }
      />

      <Route
        path="/my-bookings/:id"
        element={
          <ProtectedRoute
            loggedInUser={loggedInUser}
            element={<CustomerBookingDetail />}
          />
        }
      />

      {/* Payment Routes (Bảo vệ) */}
      <Route
        path="/payment/:bookingId"
        element={
          <ProtectedRoute
            loggedInUser={loggedInUser}
            element={<PaymentPage />}
          />
        }
      />
      <Route
        path="/payment/instructions/:paymentId"
        element={
          <ProtectedRoute
            loggedInUser={loggedInUser}
            element={<PaymentInstructionsPage />}
          />
        }
      />
      <Route
        path="/payment/result/:paymentId"
        element={
          <ProtectedRoute
            loggedInUser={loggedInUser}
            element={<PaymentResultPage />}
          />
        }
      />

      {/* Supporter Route (Bảo vệ) */}
      <Route
        path="/supporter/tickets"
        element={
          <SupporterRoute
            loggedInUser={loggedInUser}
            element={<TicketManagementPage loggedInUser={loggedInUser} />}
          />
        }
      />
    </Routes>
  );
}