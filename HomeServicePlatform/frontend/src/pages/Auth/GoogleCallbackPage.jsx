// src/pages/Auth/GoogleCallbackPage.jsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export function GoogleCallbackPage({ onLoginSuccess }) {
  const location = useLocation();
  const navigate = useNavigate();

useEffect(() => {
  const processGoogleLogin = async () => {
    try {
      const urlParams = new URLSearchParams(location.search);
      const jwtToken = urlParams.get('token');
      
      if (!jwtToken) {
        alert('Không tìm thấy token từ Google login');
        return navigate('/login', { replace: true });
      }

      const decoded = jwtDecode(jwtToken);
      const userId = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
      const email = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
      const name = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || "";
      const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "";

      // Lưu vào localStorage
      localStorage.setItem("jwtToken", jwtToken);
      localStorage.setItem("userId", userId || "");
      localStorage.setItem("email", email || "");
      localStorage.setItem("name", name);
      localStorage.setItem("role", role);

      // Cập nhật state
      onLoginSuccess({ userId, email, jwtToken, name, role });

      // Chuyển hướng
      navigate("/", { replace: true });

    } catch (error) {
      console.error("Google login processing error:", error);
      alert('Lỗi xử lý đăng nhập Google: ' + error.message);
      navigate("/login", { replace: true });
    }
  };

  processGoogleLogin();
}, [location.search]); 

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-xl text-center">
        <div className="flex justify-center mb-4">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="text-xl font-semibold text-gray-700">Đang xử lý đăng nhập Google...</p>
        <p className="text-sm text-gray-500 mt-2">Đang chuyển hướng về trang chủ...</p>
      </div>
    </div>
  );
}