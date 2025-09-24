// src/routes/ClientRoutes.jsx
import { Routes, Route } from "react-router-dom";
import { HomePage } from "../pages/client/HomePage";

export default function ClientRoutes({ loggedInUser, onLogout, onShowLogin, onShowRegister }) {
  return (
    <Routes>
      <Route path="/" element={
        <HomePage 
            loggedInUser={loggedInUser}
            onLogout={onLogout}
            onShowLogin={onShowLogin}
            onShowRegister={onShowRegister}
        />} 
      />
    </Routes>
  );
}