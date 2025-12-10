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
  Sparkles, // Thêm Sparkles cho hiệu ứng loading
} from "lucide-react";
import { authApi } from "../../services/authApi.jsx";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher.jsx";
//eslint-disable-next-line
import { motion } from "framer-motion"; // Import motion

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
    userType: "", // Giữ nguyên trường này dù không dùng trong form
    agreeToTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // eslint-disable-next-line no-useless-escape
  const phoneRegex = /^[+]?[\s\d\-\(\)]*$/;

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
    if (validationErrors[name] || validationErrors.form) {
      setValidationErrors((prev) => ({ ...prev, [name]: "", form: "" }));
    }
    if (successMessage) {
        setSuccessMessage("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});
    setSuccessMessage(""); 
    let errors = {};
    let formIsValid = true;
    
    if (!formData.fullName) {
      errors.fullName = t("validation.full_name_required");
      formIsValid = false;
    }
    if (!formData.email) {
      errors.email = t("validation.email_required");
      formIsValid = false;
    } else if (!emailRegex.test(formData.email)) {
      errors.email = t("validation.email_invalid_format");
      formIsValid = false;
    }
    if (!formData.phoneNumber) {
      errors.phoneNumber = t("validation.phone_required");
      formIsValid = false;
    } else {
      const cleanedPhone = formData.phoneNumber.replace(/\D/g, "");
      const requiredLength = 10;

      if (!phoneRegex.test(formData.phoneNumber)) {
        errors.phoneNumber = t("validation.phone_invalid_format");
        formIsValid = false;
      } 
      else if (cleanedPhone.length < requiredLength) {
        errors.phoneNumber = t("validation.phone_too_short");
        formIsValid = false;
      } else if (cleanedPhone.length > requiredLength) {
        errors.phoneNumber = t("validation.phone_too_long");
        formIsValid = false;
      }
    }

    if (!formData.password) {
      errors.password = t("validation.password_required");
      formIsValid = false;
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = t("validation.confirm_password_required");
      formIsValid = false;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      errors.password = passwordError;
      formIsValid = false;
    }

    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t("validation.password_mismatch");
      formIsValid = false;
    }

    if (!formData.agreeToTerms) {
      errors.agreeToTerms = t("validation.terms_required");
      formIsValid = false;
    }

    if (!formIsValid) {
        setValidationErrors(errors);
        return;
    }
    // === END VALIDATION ===

    setLoading(true);

    try {
      const res = await authApi.register(formData);
      console.log("Register response:", res);

      if (res.success) {
        setSuccessMessage(t("success.registration")); 
        
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
        let errorKey = "fullName";

        if (
          errorMessage.includes("email") &&
          (errorMessage.includes("exist") ||
            errorMessage.includes("tồn tại") ||
            errorMessage.includes("emailalreadyexists") ||
            errorMessage.includes("đã tồn tại") ||
            errorMessage.includes("already exists"))
        ) {
          errorKey = "email";
          errors.email = t("error.email_in_use");
        } else if (
          errorMessage.includes("username") &&
          (errorMessage.includes("exist") ||
            errorMessage.includes("tồn tại") ||
            errorMessage.includes("đã tồn tại"))
        ) {
          errorKey = "fullName"; 
          errors.fullName = t("error.username_in_use");
        } else if (errorMessage.includes("user creation failed")) {
          errors[errorKey] = t("error.user_creation_failed");
        } else {
          // Lỗi chung (không rõ), hiển thị dưới FullName
          errors[errorKey] = res.message || t("error.try_again");
        }
        setValidationErrors(errors);
      }
    } catch (err) {
      console.error("Register error:", err);
      console.log("Error response status:", err.response?.status);

      let serverErrorKey = "fullName";
      let serverErrorMessage = t("error.network_connect_failed");

      if (err.response?.data?.message) {
        const message = err.response.data.message.toLowerCase();

        if (
          message.includes("email") &&
          (message.includes("exist") ||
            message.includes("already exist"))
        ) {
          serverErrorKey = "email";
          serverErrorMessage = t("error.email_in_use");
        } else if (
          message.includes("username") &&
          (message.includes("exist") ||
            message.includes("tồn tại") ||
            message.includes("đã tồn tại"))
        ) {
          serverErrorKey = "fullName"; 
          serverErrorMessage = t("error.username_in_use");
        } else if (message.includes("user creation failed")) {
          serverErrorMessage = t("error.user_creation_failed");
        } else {
          serverErrorMessage = err.response.data.message || t("error.try_again");
        }
      } else if (err.response?.status === 400) {
        serverErrorMessage = t("error.invalid_registration_info");
      } else if (err.response?.status === 500) {
        serverErrorMessage = t("error.server_internal");
      } else {
        serverErrorMessage = t("error.network_connect_failed");
      }
      
      setValidationErrors({ [serverErrorKey]: serverErrorMessage });
    } finally {
      setLoading(false);
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
      {/* Animated Background Circles (Tương tự LoginPage) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.2, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-cyan-400 to-blue-400 rounded-full blur-3xl"
        />
      </div>

      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Panel (Tương tự LoginPage) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 text-white relative overflow-hidden">
          {/* Animated Pattern Overlay */}
          <div className="absolute inset-0">
            <motion.div
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                                 radial-gradient(circle at 80% 80%, white 1px, transparent 1px)`,
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
                {t("ui.service_description_long")}
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

        {/* Right Panel - Register Form (Đã đồng bộ) */}
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
                  {t("ui.register_account")}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-600"
                >
                  {t("ui.register_tagline")}
                </motion.p>
              </div>

              {/* Form Section */}
              <div className="px-8 pb-8 pt-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-gray-100">
                {successMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl"
                  >
                      <p className="text-green-700 text-sm font-medium">{successMessage}</p>
                  </motion.div>
                )}
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  {/* FullName */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-2"
                  >
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      {t("form.label.fullname")}
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder={t("form.placeholder.fullname")}
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all ${
                            validationErrors.fullName ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200'
                        }`}
                      />
                    </div>
                    {validationErrors.fullName && (
                        <motion.p 
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-red-600 flex items-center gap-1 mt-1"
                        >
                            <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                            {validationErrors.fullName}
                        </motion.p>
                    )}
                  </motion.div>

                  {/* Email */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-2"
                  >
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      {t("form.label.email")}
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder={t("form.placeholder.email")}
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all ${
                            validationErrors.email ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200'
                        }`}
                      />
                    </div>
                    {validationErrors.email && (
                        <motion.p 
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-red-600 flex items-center gap-1 mt-1"
                        >
                            <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                            {validationErrors.email}
                        </motion.p>
                    )}
                  </motion.div>

                  {/* Phone Number */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-2"
                  >
                    <label
                      htmlFor="phoneNumber"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      {t("form.label.phone")}
                    </label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        placeholder={t("form.placeholder.phone")}
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all ${
                            validationErrors.phoneNumber ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200'
                        }`}
                      />
                    </div>
                    {validationErrors.phoneNumber && (
                        <motion.p 
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-red-600 flex items-center gap-1 mt-1"
                        >
                            <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                            {validationErrors.phoneNumber}
                        </motion.p>
                    )}
                  </motion.div>

                  {/* Password */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-2"
                  >
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      {t("form.label.password")}
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("form.placeholder.password")}
                        value={formData.password}
                        onChange={handleInputChange}
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
                    {validationErrors.password ? (
                        <motion.p 
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-red-600 flex items-center gap-1 mt-1"
                        >
                            <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                            {validationErrors.password}
                        </motion.p>
                    ) : (
                        <p className="text-xs text-gray-500 mt-1">
                            {t("error.password_strength_hint")}
                        </p>
                    )}
                  </motion.div>

                  {/* Confirm Password */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="space-y-2"
                  >
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      {t("form.label.confirm_password")}
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={t("form.placeholder.confirm_password")}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all ${
                            validationErrors.confirmPassword ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200'
                        }`}
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </motion.button>
                    </div>
                    {validationErrors.confirmPassword && (
                        <motion.p 
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-red-600 flex items-center gap-1 mt-1"
                        >
                            <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                            {validationErrors.confirmPassword}
                        </motion.p>
                    )}
                  </motion.div>

                  {/* Terms and Conditions */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="space-y-2"
                  >
                      <div className="flex items-start space-x-3">
                        <input
                          id="agreeToTerms"
                          name="agreeToTerms"
                          type="checkbox"
                          checked={formData.agreeToTerms}
                          onChange={handleInputChange}
                          className={`mt-1.5 w-5 h-5 text-blue-600 border-2 rounded focus:ring-2 focus:ring-blue-500 ${
                              validationErrors.agreeToTerms ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        <label
                          htmlFor="agreeToTerms"
                          className="text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          {t("ui.i_agree_to")}{" "}
                          <a href="#" className="text-blue-600 hover:text-cyan-600 transition-colors hover:underline">
                            {t("ui.terms_of_service")}
                          </a>{" "}
                          {t("ui.and")}{" "}
                          <a href="#" className="text-blue-600 hover:text-cyan-600 transition-colors hover:underline">
                            {t("ui.privacy_policy")}
                          </a>
                        </label>
                      </div>
                      {validationErrors.agreeToTerms && (
                          <motion.p 
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-sm text-red-600 flex items-center gap-1 pl-8"
                          >
                            <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                              {validationErrors.agreeToTerms}
                          </motion.p>
                      )}
                  </motion.div>

                  {/* Register button */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
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
                        {t("ui.registering")}
                      </span>
                    ) : (
                      t("ui.register_button")
                    )}
                  </motion.button>
                </form>

                <div className="mt-6 text-center">
                  <span className="text-gray-600">
                    {t("ui.already_have_account")}
                  </span>{" "}
                  <motion.button
                    whileHover={{ x: 3 }}
                    className="text-blue-600 font-semibold hover:text-cyan-600 transition-colors"
                    onClick={onSwitchToLogin}
                  >
                    {t("ui.login_now")}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}