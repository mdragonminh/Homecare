// LoginPage.jsx - ĐÃ SỬA ĐỔI ĐẦY ĐỦ

import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, Home, ArrowLeft, Wrench, Shield, CheckCircle } from "lucide-react";
import { authApi } from "../../services/authApi.jsx";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import LanguageSwitcher from '../../components/LanguageSwitcher.jsx';
import { useTranslation } from "react-i18next";

export function LoginPage({ onSwitchToRegister, onBackToHome, onLoginSuccess, loggedInUser }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation(); 

  // Regex cơ bản để kiểm tra định dạng email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 

  useEffect(() => {
    if (loggedInUser) {
      navigate("/");
    }
  }, [loggedInUser, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // 1. KIỂM TRA TRƯỜNG RỖNG
    if (!formData.email) {
      setError(t("validation.email_required"));
      return;
    }

    // 2. KIỂM TRA ĐỊNH DẠNG EMAIL
    if (!emailRegex.test(formData.email)) {
        // Khóa dịch này cần được định nghĩa trong file ngôn ngữ của bạn
        setError(t("validation.email_invalid_format")); 
        return;
    }

    if (!formData.password) {
      setError(t("validation.password_required"));
      return;
    }
    
    setLoading(true);

    try {
      const res = await authApi.login(formData);

      if (res.success) {
        const { jwtToken } = res.data;
        const decoded = jwtDecode(jwtToken);
        const userId = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
        const email = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
        const name = decoded["name"] || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
        const role = decoded["role"] || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

        onLoginSuccess({ userId, email, jwtToken, name, role, requirePasswordSetup: res.data.requirePasswordSetup });
        
      } else {
        // Lỗi từ authApi (thường là lỗi 400 hoặc 401 đã được xử lý trong authApi.js)
        setError(res.message || t("error.try_again")); 
      }
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);

      if (err.response) {
        const status = err.response.status;
        const backendMessage = err.response.data?.message;

        if (status === 400) {
          setError(backendMessage || t("error.invalid_request")); 
        } else if (status === 401) {
          // Logic kiểm tra lỗi 401 (Unauthorized)
          if (backendMessage && (backendMessage.includes("Invalid credentials") || backendMessage.includes("Invalid password"))) {
            setError(t("error.invalid_email_or_password")); 
          } else if (backendMessage && backendMessage.includes("not confirmed")) {
            setError(t("error.account_not_activated")); 
          } else {
            setError(t("error.account_not_activated")); 
          }
        } else if (status === 500) {
          setError(t("error.server_internal")); 
        } else {
          setError(t("error.unknown", { status })); 
        }
      } else if (err.request) {
        setError(t("error.network"));
      } else {
        setError(t("error.unexpected"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    authApi.googleLogin();
  };

  const handleForgotPassword = () => {
    alert(t("ui.forgot_password_alert"));
  };

  if (loggedInUser) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-xl text-blue-600 font-semibold">{t("ui.redirecting_home")}</p>
      </div>
    );
  }

  // --- JSX chỉ render khi chưa đăng nhập ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 relative">
       <div className="absolute top-4 right-4 z-20"> 
       <LanguageSwitcher />
    </div>
      {/* Background Pattern */}
      {/* ... (phần background giữ nguyên) ... */}

      <div className="relative z-10 min-h-screen flex">
        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex flex-col justify-center px-12 py-16">
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                  <Wrench className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">HomeServicePlatform</h1>
                  <p className="text-blue-100 text-sm">{t("ui.service_tagline")}</p>
                </div>
              </div>
              <p className="text-blue-100 text-lg leading-relaxed">
                {t("ui.service_description")}
              </p>
            </div>

            <div className="space-y-6">
              {/* Feature 1 */}
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{t("feature.professional_worker.title")}</h3>
                  <p className="text-blue-100 text-sm">{t("feature.professional_worker.subtitle")}</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{t("feature.quality_warranty.title")}</h3>
                  <p className="text-blue-100 text-sm">{t("feature.quality_warranty.subtitle")}</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{t("feature.home_service.title")}</h3>
                  <p className="text-blue-100 text-sm">{t("feature.home_service.subtitle")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <button
              className="mb-8 flex items-center text-gray-600 hover:text-blue-600"
              onClick={onBackToHome}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("ui.back_to_home")}
            </button>
            
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="px-8 pt-8 pb-6 text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                  <Home className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{t("ui.welcome_back")}</h2>
                <p className="text-gray-500">{t("ui.login_to_continue")}</p>
              </div>

              <div className="px-8 pb-8">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}

                {/* SỬA: Thêm noValidate vào form */}
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">{t("form.label.email")}</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder={t("form.placeholder.email")}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border rounded-xl focus:ring focus:ring-blue-200"

                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">{t("form.label.password")}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder={t("form.placeholder.password")}
                        className="w-full pl-12 pr-12 py-4 bg-gray-50 border rounded-xl focus:ring focus:ring-blue-200"

                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember & Forgot */}
                  <div className="flex justify-between items-center">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleInputChange}
                        className="w-4 h-4"
                      />
                      {t("ui.remember_me")}
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {t("ui.forgot_password")}
                    </button>
                  </div>

                  {/* Login button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    {loading ? t("ui.logging_in") : t("ui.login_button")}
                  </button>
                </form>

                <div className="my-6 flex items-center">
                  <hr className="flex-1 border-gray-200" />
                  <span className="px-4 text-sm text-gray-500">{t("ui.or")}</span>
                  <hr className="flex-1 border-gray-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-3 border rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-50"
                >
                  <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" className="w-5 h-5" />
                  <span>{t("ui.login_with_google")}</span>
                </button>

                <div className="mt-6 text-center">
                  <span className="text-gray-600">{t("ui.no_account")} </span>
                  <button
                    onClick={onSwitchToRegister}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    {t("ui.register_now")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}