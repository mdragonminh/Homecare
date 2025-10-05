import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { authApi } from "./services/authApi";
import { Toaster, toast } from "sonner";
import { useTranslation } from "react-i18next";
export default function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { t } = useTranslation();
  // Lấy thông tin user từ localStorage
  const updateLoggedInUserFromStorage = useCallback(() => {
    const jwtToken = localStorage.getItem("jwtToken");
    const userId = localStorage.getItem("userId");
    const email = localStorage.getItem("email");
    const name = localStorage.getItem("name");
    const role = localStorage.getItem("role");
    const requirePasswordSetup =
      localStorage.getItem("requirePasswordSetup") === "true";

    console.log("requirePasswordSetup:", requirePasswordSetup); // Log để kiểm tra

    if (jwtToken && userId && email && !requirePasswordSetup) {
      setLoggedInUser({
        userId,
        email,
        jwtToken,
        name: name || "",
        role: role || "",
      });
    } else {
      setLoggedInUser(null);
    }

    setIsInitialized(true);
  }, []);

  useEffect(() => {
    updateLoggedInUserFromStorage();
    const handleStorageChange = () => updateLoggedInUserFromStorage();
    window.addEventListener("storage", handleStorageChange);

    return () => window.removeEventListener("storage", handleStorageChange);
  }, [updateLoggedInUserFromStorage]);

  const handleLoginSuccess = useCallback((data, skipStateUpdate = false) => {
    const token = data.jwtToken || data.token;
    if (token) {
      localStorage.setItem("jwtToken", token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("email", data.email);
      localStorage.setItem("name", data.name || "");
      localStorage.setItem("role", data.role || "");
      localStorage.setItem(
        "requirePasswordSetup",
        data.requirePasswordSetup?.toString() || "false"
      );

      if (!skipStateUpdate) {
        setLoggedInUser({
          userId: data.userId,
          email: data.email,
          jwtToken: token,
          name: data.name || "",
          role: data.role || "",
        });
        setShowLoginToast(true);
      }
    }
  }, []);

  const handleLogout = useCallback(() => {
    authApi.logout();
    setLoggedInUser(null);
    toast.info(t("toast.logout_success") || "Đăng xuất thành công 👋", {
      duration: 500,
    });
  }, [t]);

  const handlePasswordSetSuccess = useCallback(() => {
    localStorage.setItem("requirePasswordSetup", "false"); // Cập nhật sau khi thêm mật khẩu
    updateLoggedInUserFromStorage();
    setShowLoginToast(true);
  }, [updateLoggedInUserFromStorage]);

  useEffect(() => {
    if (showLoginToast) {
      toast.dismiss();
      // Thay thế chuỗi này:
      toast.success(t("toast.login_success") || "Đăng nhập thành công! 🎉", {
        duration: 500,
      });
      setShowLoginToast(false);
    }
  }, [showLoginToast, t]); 

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        {isInitialized ? (
          <AppRoutes
            loggedInUser={loggedInUser}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
            onPasswordSetSuccess={handlePasswordSetSuccess}
          />
        ) : (
          <div className="flex justify-center items-center h-screen">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}
      </div>
      <Toaster position="top-right" richColors duration={1500} />
    </BrowserRouter>
  );
}
