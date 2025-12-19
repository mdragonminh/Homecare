/* eslint-disable no-useless-escape */
import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Home,
  ArrowLeft,
  Wrench,
  Shield,
  CheckCircle,
  Sparkles,
} from "lucide-react";
// eslint-disable-next-line
import { motion } from "framer-motion";
import { authApi } from "../../services/authApi.jsx";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import LanguageSwitcher from "../../components/LanguageSwitcher.jsx";
import { useTranslation } from "react-i18next";

export function LoginPage({
  onSwitchToRegister,
  onBackToHome,
  onLoginSuccess,
  loggedInUser,
  onSwitchToForgotPassword,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (loggedInUser) {
      const role = loggedInUser.role || localStorage.getItem("role");
      if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (role === "supporter") {
        navigate("/supporter/tickets", { replace: true });
      } else if (role === "operator") {
        navigate("/operator/customers", { replace: true });
      } else if (role === "equipmentmanager") {
        navigate("/warehouse/equipments", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const errorMessage = urlParams.get('error');
    if (errorMessage) {
      setValidationErrors({ 
        emailOrPhone: decodeURIComponent(errorMessage) 
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [loggedInUser, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({}); 
    setLoading(true);
    let errors = {};
    let formIsValid = true;

    if (!formData.emailOrPhone.trim()) {
      errors.emailOrPhone = t("validation.email_or_phone_required");
      formIsValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[+]?[\s\d\-\(\)]*$/; 
      const isValidEmail = emailRegex.test(formData.emailOrPhone);
      const isValidPhone = phoneRegex.test(formData.emailOrPhone) && formData.emailOrPhone.replace(/\D/g, "").length >= 8;

      if (!isValidEmail && !isValidPhone) {
        errors.emailOrPhone = t("validation.email_or_phone_invalid_format");
        formIsValid = false;
      }
    }

    if (!formData.password) {
      errors.password = t("validation.password_required");
      formIsValid = false;
    }
    if (!formIsValid) {
      setValidationErrors(errors);
      setLoading(false);
      return;
    }
    try {
      const res = await authApi.login(formData);

      if (res.success) {
        const { jwtToken } = res.data;
        const decoded = jwtDecode(jwtToken);
        const userId = decoded.sub || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
        const email = decoded.email || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
        const name = decoded["UniqueName"] || decoded["name"] || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
        const role = decoded["role"] || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

        const userData = {
          userId,
          email,
          jwtToken,
          name,
          role,
          requirePasswordSetup: res.data.requirePasswordSetup,
          mustChangePasswordOnLogin: res.data.mustChangePasswordOnLogin,
        };

        onLoginSuccess(userData);

        if (res.data.requirePasswordSetup) {
          navigate("/add-password", { replace: true });
        } else if (role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else if (role === "supporter") {
          navigate("/supporter/tickets", { replace: true });
        } else if (role === "operator") {
          navigate("/operator/customers", { replace: true });
        } else if (role === "equipmentmanager") {
          navigate("/warehouse/equipments", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else {
        let errorMessage = t("error.invalid_email_or_password"); 
        switch (res.errorType) {
          case "INVALID_EMAIL_FORMAT":
            errorMessage = t("error.invalid_email_format");
            setValidationErrors({ emailOrPhone: errorMessage });
            break;
          case "INVALID_PASSWORD":
            errorMessage = t("error.invalid_password");
            setValidationErrors({ password: errorMessage });
            break;
          case "EMAIL_NOT_CONFIRMED":
            errorMessage = t("error.email_not_confirmed");
            setValidationErrors({ emailOrPhone: errorMessage });
            break;
          case "ACCOUNT_INACTIVE":
            errorMessage = t("error.account_inactive");
            setValidationErrors({ emailOrPhone: errorMessage });
            break;
          case "INVALID_CREDENTIALS":
          default:
            setValidationErrors({ emailOrPhone: errorMessage }); 
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setValidationErrors({ emailOrPhone: t("error.network") }); 
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    authApi.googleLogin();
  };

  const handleForgotPassword = () => {
    if (onSwitchToForgotPassword) {
      onSwitchToForgotPassword();
    }
  };

  if (loggedInUser) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-xl text-gray-700 font-semibold">
            {t("ui.redirecting_home")}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 relative overflow-hidden">
      {/* Animated Background Circles */}
     {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.2, 0.4], 
          }}
          transition={{
            duration: 5, // Chạy nhanh hơn (từ 8s xuống 5s)
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 6, // Chạy nhanh hơn (từ 10s xuống 6s)
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-cyan-400 to-blue-400 rounded-full blur-3xl"
        />
      </div>

      {/* <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div> */}

      <div className="relative z-10 min-h-screen flex">
        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 text-white relative overflow-hidden">
        <div className="absolute inset-0">
            <motion.div
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 10, // Tốc độ trượt nhanh hơn gấp đôi (từ 20s xuống 10s)
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="absolute inset-0 opacity-20" // Độ mờ vừa phải
              style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, white 1.5px, transparent 1.5px),
                                 radial-gradient(circle at 80% 80%, white 1.5px, transparent 1.5px)`,
                backgroundSize: "50px 50px",
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col justify-center px-12 py-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <div className="flex items-center mb-6">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-4 shadow-lg"
                >
                  <Wrench className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold">HomeServicePlatform</h1>
                  <p className="text-cyan-100 text-sm">
                    {t("ui.service_tagline")}
                  </p>
                </div>
              </div>
              <p className="text-blue-100 text-lg leading-relaxed">
                {t("ui.service_description")}
              </p>
            </motion.div>

            <div className="space-y-6">
              {[
                { icon: CheckCircle, titleKey: "professional_worker" },
                { icon: Shield, titleKey: "quality_warranty" },
                { icon: Home, titleKey: "home_service" },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  whileHover={{ x: 10 }}
                  className="flex items-start space-x-4 group"
                >
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {t(`feature.${feature.titleKey}.title`)}
                    </h3>
                    <p className="text-cyan-100 text-sm">
                      {t(`feature.${feature.titleKey}.subtitle`)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <motion.button
              whileHover={{ x: -5 }}
              className="mb-8 flex items-center text-gray-600 hover:text-blue-600 transition-colors"
              onClick={onBackToHome}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("ui.back_to_home")}
            </motion.button>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
              {/* Header Section */}
              <div className="px-8 pt-8 pb-6 text-center bg-gradient-to-br from-blue-50 to-cyan-50">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg mb-6"
                >
                  <Home className="w-8 h-8 text-white" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2"
                >
                  {t("ui.welcome_back")}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-600"
                >
                  {t("ui.login_to_continue")}
                </motion.p>
              </div>

              {/* Form Section */}
              <div className="px-8 pb-8 pt-6">
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  {/* Email or Phone */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-2"
                  >
                    <label className="block text-sm font-semibold text-gray-700">
                      {t("form.label.email_or_phone")}
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <input
                        name="emailOrPhone"
                        type="text"
                        value={formData.emailOrPhone}
                        onChange={handleInputChange}
                        placeholder={t("form.placeholder.email_or_phone")}
                        className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all ${
                          validationErrors.emailOrPhone ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200'
                        }`}
                      />
                    </div>
                    {validationErrors.emailOrPhone && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-600 flex items-center gap-1"
                      >
                        <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                        {validationErrors.emailOrPhone}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Password */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-2"
                  >
                    <label className="block text-sm font-semibold text-gray-700">
                      {t("form.label.password")}
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder={t("form.placeholder.password")}
                        className={`w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all ${
                          validationErrors.password ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200'
                        }`}
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </motion.button>
                    </div>
                    {validationErrors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-600 flex items-center gap-1"
                      >
                        <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                        {validationErrors.password}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Remember & Forgot */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex justify-between items-center"
                  >
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                        {t("ui.remember_me")}
                      </span>
                    </label>
                    <motion.button
                      whileHover={{ x: 3 }}
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm font-medium text-blue-600 hover:text-cyan-600 transition-colors"
                    >
                      {t("ui.forgot_password")}
                    </motion.button>
                  </motion.div>

                  {/* Login button */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        {t("ui.logging_in")}
                      </span>
                    ) : (
                      t("ui.login_button")
                    )}
                  </motion.button>
                </form>

                <div className="my-6 flex items-center">
                  <hr className="flex-1 border-gray-200" />
                  <span className="px-4 text-sm text-gray-500 font-medium">
                    {t("ui.or")}
                  </span>
                  <hr className="flex-1 border-gray-200" />
                </div>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-3.5 border-2 border-gray-200 rounded-xl flex items-center justify-center space-x-3 hover:bg-gray-50 hover:border-gray-300 transition-all group"
                >
                  <img
                    src="https://www.svgrepo.com/show/355037/google.svg"
                    alt="Google"
                    className="w-5 h-5 group-hover:scale-110 transition-transform"
                  />
                  <span className="font-medium text-gray-700">{t("ui.login_with_google")}</span>
                </motion.button>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="mt-6 text-center"
                >
                  <span className="text-gray-600">{t("ui.no_account")} </span>
                  <motion.button
                    whileHover={{ x: 3 }}
                    onClick={onSwitchToRegister}
                    className="text-blue-600 font-semibold hover:text-cyan-600 transition-colors"
                  >
                    {t("ui.register_now")}
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}