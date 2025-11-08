import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../../services/authApi.jsx";
import { toast } from "sonner";

export function GoogleCallbackPage({ onLoginSuccess }) {
  const location = useLocation();
  const navigate = useNavigate();
  const executedRef = useRef(false);

  useEffect(() => {
    const processGoogleLogin = async () => {
      if (executedRef.current) return;
      executedRef.current = true;
      try {
        const result = await authApi.parseGoogleTokenFromUrl(location.search);

        console.log("parseResult:", result);

        if (!result.success) {
          toast.error(result.message || "Đăng nhập Google thất bại.");
          return navigate("/login", { replace: true });
        }

        const {
          jwtToken,
          refreshToken,
          requirePasswordSetup,
          userId,
          email,
          name,
          role,
        } = result.data;

        const userData = {
          userId,
          email,
          jwtToken,
          refreshToken: refreshToken || "",
          name: name || "",
          role: role || "",
          requirePasswordSetup: !!requirePasswordSetup,
        };

        onLoginSuccess(userData, requirePasswordSetup);

        if (requirePasswordSetup) {
          navigate("/add-password", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Google login error:", error);
        toast.error("Lỗi xử lý đăng nhập. Vui lòng thử lại.");
        navigate("/login", { replace: true });
      }
    };

    processGoogleLogin();
  }, [location.search, navigate, onLoginSuccess]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg">
        <div className="flex justify-center mb-4">
          <span className="loading loading-spinner loading-lg text-blue-600"></span>
        </div>
        <p className="text-lg font-medium text-gray-700">
          Đang xử lý đăng nhập Google...
        </p>
        <p className="text-sm text-gray-500 mt-2">Vui lòng chờ một chút</p>
      </div>
    </div>
  );
}
