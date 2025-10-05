// src/components/LanguageSwitcher.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, ChevronDown } from "lucide-react";

// Component Cờ Việt Nam
const VietnamFlag = ({ selected, size = "md" }) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-md border-2 flex items-center justify-center overflow-hidden transition-all duration-300 shadow-sm ${
        selected 
          ? "border-red-400 shadow-lg shadow-red-200/50 scale-105" 
          : "border-gray-200 hover:border-red-300"
      }`}
      style={{ 
        backgroundColor: "#da251d",
        background: selected 
          ? "linear-gradient(135deg, #da251d 0%, #b91c1c 100%)"
          : "#da251d"
      }}
    >
      <div
        className={`transition-all duration-300 ${selected ? 'animate-pulse' : ''}`}
        style={{
          width: "60%",
          height: "60%",
          clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
          backgroundColor: "#ffd700",
          filter: selected ? "drop-shadow(0 0 3px rgba(255, 215, 0, 0.8))" : "none",
        }}
      />
    </div>
  );
};

// Component Cờ Hoa Kỳ
const USFlag = ({ selected, size = "md" }) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-md border-2 flex items-center justify-center overflow-hidden transition-all duration-300 shadow-sm ${
        selected 
          ? "border-blue-400 shadow-lg shadow-blue-200/50 scale-105" 
          : "border-gray-200 hover:border-blue-300"
      }`}
      style={{
        background: selected
          ? "linear-gradient(to bottom, #b22234 0 30%, #fff 30% 45%, #b22234 45% 60%, #fff 60% 75%, #b22234 75% 100%)"
          : "linear-gradient(to bottom, #b22234 0 33%, #fff 33% 66%, #b22234 66% 100%)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "45%",
          height: "55%",
          background: selected 
            ? "linear-gradient(135deg, #3c3b6e 0%, #1e3a8a 100%)"
            : "#3c3b6e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size === "lg" ? "9px" : "7px",
          color: "#fff",
          borderRadius: "2px",
        }}
      >
        <span className={`font-sans ${selected ? 'animate-pulse' : ''}`}>★</span>
      </div>
    </div>
  );
};

// Component Dropdown Language Item
const LanguageOption = ({ langCode, details, onClick, isActive }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-2 px-3 py-2 text-left transition-all duration-200 ${
      isActive 
        ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900" 
        : "hover:bg-gray-50 text-gray-700"
    }`}
  >
    <details.flagComponent selected={isActive} size="md" />
    <div className="flex-1">
      <div className={`font-medium text-sm ${isActive ? "text-blue-900" : "text-gray-900"}`}>
        {details.name}
      </div>
      <div className="text-xs text-gray-500">{langCode}</div>
    </div>
    {isActive && (
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
    )}
  </button>
);

// Component Chính LanguageSwitcher
const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = {
    vi: {
      flagComponent: VietnamFlag,
      name: t("language.vietnamese", "Tiếng Việt"),
      nativeName: t("language.vietnam", "Việt Nam"),
      code: "VI"
    },
    en: {
      flagComponent: USFlag,
      name: t("language.english", "English"),
      nativeName: t("language.united_states", "United States"),
      code: "EN"
    }
  };

  const currentLang = i18n.language || "vi";
  const currentLangDetails = languages[currentLang] || languages["vi"];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem("appLang", langCode);
    setIsOpen(false);
  };

  // Handle Escape key to close dropdown
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative">
      {/* Nút chính */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-xl bg-white shadow-md border border-gray-200/50 transition-all duration-300 hover:shadow-lg hover:border-gray-300 group ${
          isOpen ? 'shadow-lg border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50' : ''
        }`}
      >
        <div className="relative">
          <Globe className={`w-4 h-4 transition-all duration-300 ${
            isOpen ? 'text-blue-600 rotate-12' : 'text-gray-600 group-hover:text-blue-600'
          }`} />
          {isOpen && (
            <div className="absolute -inset-1 bg-blue-400/20 rounded-full animate-ping" />
          )}
        </div>
        <div className="flex items-center space-x-2">
          <currentLangDetails.flagComponent selected={true} size="md" />
          <div className="flex flex-col items-start">
            <span className="text-xs font-semibold text-gray-900">
              {currentLangDetails.code}
            </span>
            <span className="text-[10px] text-gray-500 leading-none">
              {currentLangDetails.nativeName}
            </span>
          </div>
        </div>
        <ChevronDown className={`w-3 h-3 text-gray-500 transition-all duration-300 ${
          isOpen ? 'rotate-180 text-blue-600' : 'group-hover:text-blue-600'
        }`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-1 right-0 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-20 overflow-hidden animate-in slide-in-from-top-2 duration-200">
            <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Globe className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-gray-700">
                  {t("ui.select_language")}
                </span>
              </div>
            </div>
            <div className="py-1">
              {Object.entries(languages).map(([langCode, details]) => (
                <LanguageOption
                  key={langCode}
                  langCode={langCode}
                  details={details}
                  onClick={() => handleLanguageChange(langCode)}
                  isActive={currentLang === langCode}
                />
              ))}
            </div>
            <div className="px-3 py-1 bg-gray-50 border-t border-gray-100">
              <div className="text-[10px] text-gray-500 text-center">
                {t("ui.language_auto_save")}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;