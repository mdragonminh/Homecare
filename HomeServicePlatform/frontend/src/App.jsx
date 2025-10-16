import React, { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { authApi } from "./services/authApi";
import { Toaster, toast } from "sonner"; 

export default function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  // THÊM: State mới để kiểm soát việc hiển thị toast
  const [showLoginToast, setShowLoginToast] = useState(false); 
  
  const updateLoggedInUserFromStorage = () => {
    const jwtToken = localStorage.getItem("jwtToken");
    const userId = localStorage.getItem("userId");
    const email = localStorage.getItem("email");
    const name = localStorage.getItem("name");
    const role = localStorage.getItem("role");

    if (jwtToken && userId && email) {
      setLoggedInUser({
        userId,
        email,
        jwtToken,
        name: name || "",
        role: role || ""
      });
    } else {
      setLoggedInUser(null);
    }
  };

  useEffect(() => {
    updateLoggedInUserFromStorage();
    const handleStorageChange = () => updateLoggedInUserFromStorage();
    window.addEventListener("storage", handleStorageChange);

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLoginSuccess = (data) => {
    const token = data.jwtToken || data.token;
    if (token) {
      localStorage.setItem("jwtToken", token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("email", data.email);
      localStorage.setItem("name", data.name || "");
      localStorage.setItem("role", data.role || "");

      setLoggedInUser({
        userId: data.userId,
        email: data.email,
        jwtToken: token,
        name: data.name || "",
        role: data.role || ""
      });

      // THAY THẾ setTimeout: Chỉ set cờ hiển thị toast
      setShowLoginToast(true); 
      
      // Đã loại bỏ logic setTimeout gây ra lỗi double-toast
    }
  };

  const handleLogout = () => {
    authApi.logout();
    setLoggedInUser(null);

    toast.info("Đăng xuất thành công 👋", { duration: 500 }); 
  };
  
  
  useEffect(() => {
    if (showLoginToast) {
      toast.dismiss(); 
      toast.success("Đăng nhập thành công! 🎉", { duration: 500 });
      setShowLoginToast(false); 
    }
  }, [showLoginToast]); 

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        {/* Component Header và Footer (nếu có) thường nằm ở đây */}
        
        <AppRoutes
          loggedInUser={loggedInUser}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
        />
        <Toaster position="top-right" richColors  duration={500}/>
      </div>
    </BrowserRouter>
  );
}