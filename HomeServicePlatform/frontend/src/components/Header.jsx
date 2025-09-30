// src/components/Header.jsx

import React from "react";
import { Home, LogIn, UserPlus, LogOut, User, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthButtons } from "./AuthButtons";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher"; 

export function Header({ onShowLogin, onShowRegister, loggedInUser, onLogout }) {
  const navigate = useNavigate();
  const { t } = useTranslation(); 

  return (
    <header className="bg-white shadow border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Brand */}
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={() => navigate("/")}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg text-gray-800">
              {t("app.name")} 
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => navigate("/")} 
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              {t("nav.home")} 
            </button>
            <a href="/services" className="text-gray-700 hover:text-blue-600 transition-colors">
              {t("nav.services")} 
            </a>
            <a href="/about" className="text-gray-700 hover:text-blue-600 transition-colors">
              {t("nav.about_us")} 
            </a>
            <a href="/contact" className="text-gray-700 hover:text-blue-600 transition-colors">
              {t("nav.contact")} 
            </a>
          </nav>

          {/* Auth Buttons Component + Language Switcher */}
          <div className="flex items-center space-x-3">
            <LanguageSwitcher />
            <AuthButtons
              loggedInUser={loggedInUser}
              onShowLogin={onShowLogin}
              onShowRegister={onShowRegister}
              onLogout={onLogout}
              navigate={navigate}
            />
          </div>
        </div>
      </div>
    </header>
  );
}