import React, { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    // Khi reload trang -> lấy user từ localStorage
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const email = localStorage.getItem("email");

    if (token && userId && email) {
      setLoggedInUser({ userId, email, token });
    }
  }, []);

  const handleLoginSuccess = (data) => {
    // data sẽ là { userId, jwtToken, email } từ authApi
    setLoggedInUser({
      userId: data.userId,
      email: data.email,
      token: data.jwtToken,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    setLoggedInUser(null);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <AppRoutes
          loggedInUser={loggedInUser}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
        />
        
      </div>
    </BrowserRouter>
  );
}
