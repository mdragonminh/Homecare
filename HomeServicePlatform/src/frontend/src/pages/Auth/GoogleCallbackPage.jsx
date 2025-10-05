import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { authApi } from "../../services/authApi.jsx"; 

export function GoogleCallbackPage({ onLoginSuccess }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { 
    const processGoogleLogin = async () => {
      try {
        const parseResult = authApi.parseGoogleTokenFromUrl(location.search);

        console.log("parseResult:", parseResult); // Log để kiểm tra

        if (!parseResult.success) {
          alert(parseResult.message || 'Không tìm thấy token từ Google login');
          return navigate('/login', { replace: true });
        }

        const { jwtToken, requirePasswordSetup } = parseResult.data;
        
        console.log("requirePasswordSetup:", requirePasswordSetup); // Log để kiểm tra

        // Giải mã token để lấy thông tin user
        const decoded = jwtDecode(jwtToken);
        const userId = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
        const email = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
        const name = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || "";
        const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "";

        // Dữ liệu đăng nhập
        const userData = { userId, email, jwtToken, name, role, requirePasswordSetup };

        if (requirePasswordSetup) {
          console.log("Navigating to /add-password"); // Log để kiểm tra
          onLoginSuccess(userData, true); 
          navigate('/add-password', { replace: true }); 
        } else {
          console.log("Navigating to /"); // Log để kiểm tra
          onLoginSuccess(userData);
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error("Google login processing error:", error);
        alert('Lỗi xử lý đăng nhập Google');
        navigate("/login", { replace: true });
      }
    };

    processGoogleLogin();
  }, [location.search, navigate, onLoginSuccess]);

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-xl text-center">
        <p className="text-gray-700">Đang xử lý đăng nhập Google...</p>
      </div>
    </div>
  );
}