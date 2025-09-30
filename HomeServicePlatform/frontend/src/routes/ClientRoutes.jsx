// src/routes/ClientRoutes.jsx
import { Routes, Route } from "react-router-dom";
import { HomePage } from "../pages/client/HomePage";
import HomeManagementPage from "../pages/client/home/HomeManagementPage";
import HomeItemsPage from "../pages/client/home/HomeItemsPage";
export default function ClientRoutes({ loggedInUser, onLogout, onShowLogin, onShowRegister }) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            loggedInUser={loggedInUser}
            onLogout={onLogout}
            onShowLogin={onShowLogin}
            onShowRegister={onShowRegister}
          />
        }
      />
      <Route
        path="/list-home"
        element={<HomeManagementPage loggedInUser={loggedInUser} />}
      />
      <Route
        path="/home-items/:homeId"
        element={<HomeItemsPage loggedInUser={loggedInUser} />}
      />
    </Routes>
  );
}
