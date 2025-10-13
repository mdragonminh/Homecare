import { Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "../pages/client/HomePage";
import HomeManagementPage from "../pages/client/home/HomeManagementPage";
import HomeItemsPage from "../pages/client/home/HomeItemsPage";
import Profile from "../pages/Profile";
import { jwtDecode } from "jwt-decode";
import {FindTechnicianPage} from "../pages/client/service/FindTechnicianPage";
const ProtectedRoute = ({ element: Element, loggedInUser }) => {
  if (!loggedInUser) {
    return <Navigate to="/login" replace />;
  }

  return Element;
};

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

      <Route
        path="/list-home"
        element={
          <ProtectedRoute
            loggedInUser={loggedInUser}
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
              <Profile
                loggedInUser={loggedInUser}
                onLogout={onLogout}
                onShowLogin={onShowLogin}
                onShowRegister={onShowRegister}
              />
            }
          />
        }
      />
      <Route
        path="/find-technician"
        element={
          <ProtectedRoute
            loggedInUser={loggedInUser}
            element={<FindTechnicianPage loggedInUser={loggedInUser} />}
          />
        }
      />
    </Routes>
  );
}