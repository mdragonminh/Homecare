// src/Layout.jsx
import React, { useState } from "react"; 
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Outlet } from "react-router-dom";
import { TechnicianTracker } from "../components/TechnicianTracker";

import { ChatWidget } from "../components/chat/ChatWidget";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";

export default function Layout({ loggedInUser, onLogout, onShowLogin, onShowRegister }) {

  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        loggedInUser={loggedInUser}
        onLogout={onLogout}
        onShowLogin={onShowLogin}
        onShowRegister={onShowRegister}
      />
      <TechnicianTracker role={loggedInUser?.role} />

      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />

      {loggedInUser && (
        <>
          {!isChatOpen && (
            <button
              onClick={() => setIsChatOpen(true)}
              className="fixed bottom-5 right-5 bg-blue-600 text-white p-4 rounded-full shadow-lg z-40 hover:bg-blue-700 transition-transform duration-200 hover:scale-110 cursor-pointer"
              aria-label="Mở chat"
            >
              <ChatBubbleLeftRightIcon className="w-8 h-8" />
            </button>
          )}
          {isChatOpen && (
            <ChatWidget onClose={() => setIsChatOpen(false)} />
          )}
        </>
      )}
    </div>
  );
}