import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { authApi } from "./services/authApi";
import { Toaster, toast } from "sonner"; 
import { useTranslation } from "react-i18next";
import { loadGoogleMapsAPI } from "./utils/googleMapsLoader"; 

import ChangePasswordModal from "./components/ChangePasswordModal"; 

export default function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isForceModalVisible, setIsForceModalVisible] = useState(false);

  const { t } = useTranslation();

  
  useEffect(() => {
    loadGoogleMapsAPI()
      .then(() => {
        console.log(' Google Maps API loaded successfully');
      })
      .catch((error) => {
        console.error(' Error loading Google Maps API:', error);
      });
  }, []); 

  const updateLoggedInUserFromStorage = useCallback(() => {
    const jwtToken = localStorage.getItem("jwtToken");
    const userId = localStorage.getItem("userId");
    const email = localStorage.getItem("email");
    const name = localStorage.getItem("name");
    const role = localStorage.getItem("role");
    
    const requirePasswordSetup =
      localStorage.getItem("requirePasswordSetup") === "true";
    const mustChangePasswordOnLogin =
      localStorage.getItem("mustChangePasswordOnLogin") === "true";

    if (jwtToken && userId && email) {
      setLoggedInUser({
        userId,
        email,
        jwtToken,
        name: name || "",
        role: role || "",
        requirePasswordSetup, 
        mustChangePasswordOnLogin,
      });

      if (mustChangePasswordOnLogin) {
        setIsForceModalVisible(true);
      }
    } else {
      setLoggedInUser(null);
      setIsForceModalVisible(false); 
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
      localStorage.setItem(
        "mustChangePasswordOnLogin",
        data.mustChangePasswordOnLogin?.toString() || "false"
      );

      if (!skipStateUpdate) {
        setLoggedInUser({
          userId: data.userId,
          email: data.email,
          jwtToken: token,
          name: data.name || "",
          role: data.role || "",
          requirePasswordSetup: data.requirePasswordSetup,
          mustChangePasswordOnLogin: data.mustChangePasswordOnLogin,
        });
        setShowLoginToast(true);

        if (data.mustChangePasswordOnLogin) {
          setIsForceModalVisible(true);
        }
      }
    }
  }, []);

  const handleLogout = useCallback(() => {
    authApi.logout(); 
    setLoggedInUser(null);
    setIsForceModalVisible(false);
    toast.info(t("toast.logout_success") || "Đăng xuất thành công 👋", {
      duration: 800,
    });
  }, [t]);

  const handlePasswordSetSuccess = useCallback(() => {
    localStorage.setItem("requirePasswordSetup", "false");
    localStorage.setItem("mustChangePasswordOnLogin", "false"); 
    
    setIsForceModalVisible(false);
    updateLoggedInUserFromStorage(); 
    setShowLoginToast(false);
  }, [updateLoggedInUserFromStorage]);

  const handleForceSubmit = async (currentPassword, newPassword, confirmNewPassword) => {
    const result = await authApi.changePassword({
      currentPassword,
      newPassword,
      confirmNewPassword,
    });

    if (result.success) {
      handlePasswordSetSuccess();
      toast.success("Đổi mật khẩu thành công!", {
        description: "Bây giờ bạn có thể tiếp tục sử dụng dịch vụ.",
        duration: 3000,
      });
    } else {
      throw new Error(result.message);
    }
  };

  useEffect(() => {
    if (isForceModalVisible) {
      toast.warning("Yêu cầu đổi mật khẩu", {
        description: "Vì lý do bảo mật, bạn cần đổi mật khẩu trước khi tiếp tục.",
        duration: 10000, 
        dismissible: false,
      });
    }
  }, [isForceModalVisible]);

  useEffect(() => {
    if (showLoginToast) {
      toast.dismiss();
      toast.success(t("toast.login_success") || "Đăng nhập thành công! 🎉", {
        duration: 800,
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
      <Toaster position="top-right" richColors duration={1000} />

      <ChangePasswordModal
        isOpen={isForceModalVisible}
        onClose={() => {}} 
        onSubmit={handleForceSubmit}
        isCancellable={false} 
      />
    </BrowserRouter>
  );
}