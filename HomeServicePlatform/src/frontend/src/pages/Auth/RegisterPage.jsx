// RegisterPage.jsx - ĐÃ SỬA ĐỔI HOÀN TOÀN THEO YÊU CẦU

import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Home,
  ArrowLeft,
  Wrench,
  Shield,
  CheckCircle,
  Phone,
} from "lucide-react";
import { authApi } from "../../services/authApi.jsx";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher.jsx";

export default function RegisterPage({
  onSwitchToLogin,
  onBackToHome,
  loggedInUser,
}) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    userType: "",
    agreeToTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success | warning | error
  const navigate = useNavigate();

  // Regex cơ bản để kiểm tra định dạng email và số điện thoại
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[+]?[\s\d\-\(\)]*$/; // Cho phép số, dấu +, dấu cách, dấu gạch ngang và dấu ngoặc

  useEffect(() => {
    if (loggedInUser) {
      navigate("/");
    }
  }, [loggedInUser, navigate]);

  const validatePassword = (password) => {
    const minLength = 8;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (password.length < minLength) {
      return t("validation.password_min_length");
    }
    if (!hasSpecialChar) {
      return t("validation.password_special_char");
    }
    if (!hasUpperCase) {
      return t("validation.password_uppercase");
    }
    if (!hasLowerCase) {
      return t("validation.password_lowercase");
    }
    if (!hasNumber) {
      return t("validation.password_number");
    }
    return null;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!formData.fullName) {
      setMessage(t("validation.full_name_required"));
      setMessageType("error");
      return;
    }
    if (!formData.email) {
      setMessage(t("validation.email_required"));
      setMessageType("error");
      return;
    }
    // ✅ THÊM: KIỂM TRA ĐỊNH DẠNG EMAIL (sau khi tắt noValidate)
    if (!emailRegex.test(formData.email)) {
      setMessage(t("validation.email_invalid_format"));
      setMessageType("error");
      return;
    }
    if (!formData.phoneNumber) {
      setMessage(t("validation.phone_required"));
      setMessageType("error");
      return;
    }
    if (
      !phoneRegex.test(formData.phoneNumber) ||
      formData.phoneNumber.length < 8 ||
      formData.phoneNumber.length > 20
    ) {
      setMessage(t("validation.phone_invalid_format"));
      setMessageType("error");
      return;
    }
    if (!formData.password) {
      setMessage(t("validation.password_required"));
      setMessageType("error");
      return;
    }
    if (!formData.confirmPassword) {
      setMessage(t("validation.confirm_password_required"));
      setMessageType("error");
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setMessage(passwordError);
      setMessageType("error");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage(t("validation.password_mismatch"));
      setMessageType("error");
      return;
    }

    if (!formData.agreeToTerms) {
      setMessage(t("validation.terms_required"));
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.register(formData);
      console.log("Register response:", res);

      if (res.success) {
        setMessage(t("success.registration"));
        setMessageType("success");

        setFormData({
          fullName: "",
          email: "",
          phoneNumber: "",
          password: "",
          confirmPassword: "",
          userType: "",
          agreeToTerms: false,
        });

        setTimeout(() => {
          onSwitchToLogin();
        }, 2500);
      } else {
        const errorMessage = res.message?.toLowerCase() || "";
        console.log("Error message from res:", errorMessage);

        // ✅ CẢI THIỆN: LOGIC KIỂM TRA LỖI EMAIL ĐÃ TỒN TẠI (LỖI 400 không phải là Axios Error)
        if (
          errorMessage.includes("email") &&
          (errorMessage.includes("exist") ||
            errorMessage.includes("tồn tại") ||
            errorMessage.includes("emailalreadyexists") ||
            errorMessage.includes("đã tồn tại") ||
            errorMessage.includes("already exists"))
        ) {
          setMessage(t("error.email_in_use"));
          setMessageType("error");
        } else if (
          errorMessage.includes("username") &&
          (errorMessage.includes("exist") ||
            errorMessage.includes("tồn tại") ||
            errorMessage.includes("đã tồn tại"))
        ) {
          setMessage(t("error.username_in_use"));
          setMessageType("error");
        } else if (errorMessage.includes("user creation failed")) {
          setMessage(t("error.user_creation_failed"));
          setMessageType("error");
        } else {
          setMessage(res.message || t("error.try_again"));
          setMessageType("error");
        }
      }
    } catch (err) {
      console.error("Register error:", err);
      console.log("Error response status:", err.response?.status);

      if (err.response?.data?.message) {
        const serverMessage = err.response.data.message.toLowerCase();
        console.log("Server error message:", serverMessage);

        if (
          serverMessage.includes("email") &&
          (serverMessage.includes("exist") ||
            serverMessage.includes("already exist"))
        ) {
          setMessage(t("error.email_in_use"));
        } else if (
          serverMessage.includes("username") &&
          (serverMessage.includes("exist") ||
            serverMessage.includes("tồn tại") ||
            serverMessage.includes("đã tồn tại"))
        ) {
          setMessage(t("error.username_in_use"));
        } else if (serverMessage.includes("user creation failed")) {
          setMessage(t("error.user_creation_failed"));
        } else {
          setMessage(err.response.data.message || t("error.try_again"));
        }
      } else if (err.response?.status === 400) {
        setMessage(t("error.invalid_registration_info"));
      } else if (err.response?.status === 500) {
        setMessage(t("error.server_internal"));
      } else {
        setMessage(t("error.network_connect_failed"));
      }

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  if (loggedInUser) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-xl text-blue-600 font-semibold">
          {t("ui.redirecting_home")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 relative">
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-600 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-orange-500 rounded-full blur-2xl"></div>
        <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-green-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex flex-col justify-center px-12 py-16">
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mr-4">
                  <Wrench className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{t("app.name")}</h1>
                  <p className="text-blue-100 text-sm">
                    {t("ui.service_tagline")}
                  </p>
                </div>
              </div>
              <p className="text-blue-100 text-lg leading-relaxed">
                {t("ui.service_description_long")}
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {t("feature.professional_worker.title")}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {t("feature.professional_worker.subtitle")}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {t("feature.quality_warranty.title")}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {t("feature.quality_warranty.subtitle")}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {t("feature.home_service.title")}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {t("feature.home_service.subtitle")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <button
              className="mb-8 flex items-center text-gray-600 hover:text-blue-600 transition-colors group"
              onClick={onBackToHome}
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              {t("ui.back_to_home")}
            </button>

            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="px-8 pt-8 pb-6 text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                  <Home className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {t("ui.register_account")}
                </h2>
                <p className="text-gray-500">{t("ui.register_tagline")}</p>
              </div>

              <div className="px-8 pb-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-gray-100">
                {message && (
                  <div
                    className={`mb-6 p-4 rounded-xl text-sm font-medium sticky top-0 z-10
                      ${
                        messageType === "success"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : ""
                      }
                      ${
                        messageType === "warning"
                          ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                          : ""
                      }
                      ${
                        messageType === "error"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : ""
                      }`}
                  >
                    {message}
                  </div>
                )}

                {/* ✅ SỬA: Thêm noValidate vào form để tắt validation mặc định của trình duyệt */}
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="space-y-1">
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      {t("form.label.fullname")}
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder={t("form.placeholder.fullname")}
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      {t("form.label.email")}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder={t("form.placeholder.email")}
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="phoneNumber"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      {t("form.label.phone")}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        placeholder={t("form.placeholder.phone")}
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      {t("form.label.password")}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("form.placeholder.password")}
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {t("error.password_strength_hint")}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      {t("form.label.confirm_password")}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={t("form.placeholder.confirm_password")}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <input
                      id="agreeToTerms"
                      name="agreeToTerms"
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="agreeToTerms"
                      className="text-sm font-medium text-gray-600 cursor-pointer"
                    >
                      {t("ui.i_agree_to")}{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        {t("ui.terms_of_service")}
                      </a>{" "}
                      {t("ui.and")}{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        {t("ui.privacy_policy")}
                      </a>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-3 focus:ring-blue-500/20 transform hover:scale-[1.02] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>{t("ui.registering")}</span>
                      </div>
                    ) : (
                      t("ui.register_button")
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <span className="text-gray-600">
                    {t("ui.already_have_account")}
                  </span>{" "}
                  <button
                    className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    onClick={onSwitchToLogin}
                  >
                    {t("ui.login_now")}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:hidden mt-8 text-center">
              <div className="flex items-center justify-center mb-2">
                <Wrench className="w-6 h-6 text-blue-600 mr-2" />
                <span className="text-xl font-bold text-gray-900">
                  {t("app.name")}
                </span>
              </div>
              <p className="text-sm text-gray-500">{t("ui.service_tagline")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
