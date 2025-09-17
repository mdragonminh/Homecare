// src/App.jsx
import React, { useState, useEffect } from "react";
import { HomePage } from "./pages/client/HomePage";
import { LoginPage } from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import { authApi } from "./services/authApi.jsx";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  // Thêm state để lưu thông tin người dùng
  const [loggedInUser, setLoggedInUser] = useState(null);

  // Sử dụng useEffect để kiểm tra trạng thái đăng nhập khi ứng dụng được tải
  useEffect(() => {
    // 1. Lấy token từ localStorage
    const token = localStorage.getItem("token");
    
    // 2. Nếu có token, gọi API để lấy thông tin người dùng
    if (token) {
      const fetchUser = async () => {
        // Sử dụng hàm getUserByToken đã thêm ở các bước trước
        const user = await authApi.getUserByToken(token);
        
        if (user) {
          // 3. Nếu tìm thấy user, cập nhật state
          setLoggedInUser(user);
        } else {
          // 4. Nếu token không hợp lệ, xóa token cũ
          localStorage.removeItem('token');
        }
      };
      
      fetchUser();
    }
  }, []); // [] đảm bảo hook chỉ chạy một lần khi component được mount

  // Hàm xử lý đăng nhập thành công
  const handleLoginSuccess = (user) => {
    setLoggedInUser(user);
    setCurrentPage("home");
  };

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("token");
    setLoggedInUser(null);
    setCurrentPage("home");
  };

  // Hàm render trang dựa trên state
  const renderPage = () => {
    if (currentPage === "login") {
      return (
        <LoginPage
          onSwitchToRegister={() => setCurrentPage("register")}
          onBackToHome={() => setCurrentPage("home")}
          onLoginSuccess={handleLoginSuccess}
        />
      );
    }
    if (currentPage === "register") {
      return (
        <RegisterPage
          onSwitchToLogin={() => setCurrentPage("login")}
          onBackToHome={() => setCurrentPage("home")}
        />
      );
    }
    // Truyền state và hàm xử lý mới vào HomePage
    return (
      <HomePage
        onShowLogin={() => setCurrentPage("login")}
        onShowRegister={() => setCurrentPage("register")}
        loggedInUser={loggedInUser}
        onLogout={handleLogout}
      />
    );
  };

  return <div className="min-h-screen flex flex-col">{renderPage()}</div>;
}