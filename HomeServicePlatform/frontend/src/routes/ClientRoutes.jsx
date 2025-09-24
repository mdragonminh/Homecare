// src/routes/ClientRoutes.jsx
import { Routes, Route } from "react-router-dom";
import { HomePage } from "../pages/client/HomePage";
import AddAddressPage from "../pages/client/address/AddAddressPage";


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
        path="/add-address"
        element={<AddAddressPage loggedInUser={loggedInUser} />}
      />
    </Routes>
  );
}
