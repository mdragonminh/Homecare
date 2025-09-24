import React, { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { authApi }  from "./services/authApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);

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

      
      toast.success("Đăng nhập thành công!");
    }
  };

  const handleLogout = () => {
    authApi.logout();
    setLoggedInUser(null);

    
    toast.success("Đăng xuất thành công!");
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <AppRoutes
          loggedInUser={loggedInUser}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
        />
        {/* Container để hiển thị toast */}
        <ToastContainer position="top-right" autoClose={500} />
      </div>
    </BrowserRouter>
  );
}
