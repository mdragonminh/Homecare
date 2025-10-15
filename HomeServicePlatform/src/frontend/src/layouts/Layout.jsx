// src/Layout.jsx
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Outlet } from "react-router-dom";
import { TechnicianTracker } from "../components/TechnicianTracker";
// Layout nhận props để truyền xuống Header
export default function Layout({ loggedInUser, onLogout, onShowLogin, onShowRegister }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header
        loggedInUser={loggedInUser}
        onLogout={onLogout}
        onShowLogin={onShowLogin}
        onShowRegister={onShowRegister}
      />
      {loggedInUser?.role?.toLowerCase() === "technician" && <TechnicianTracker enabled={true} />}

      <main className="flex-1">
        {/* Outlet sẽ render nội dung của các route con (ClientRoutes) */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}