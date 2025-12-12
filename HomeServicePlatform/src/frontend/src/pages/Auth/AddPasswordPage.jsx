import { useState, useEffect } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  Phone,
  Sparkles, // Giữ lại Sparkles hoặc icon phù hợp cho Header
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../services/authApi.jsx";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
// eslint-disable-next-line
import { motion } from "framer-motion"; // Import framer-motion

export function AddPasswordPage({ onPasswordSetSuccess }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    newPassword: "",
    confirmPassword: "",
    phoneNumber: "",
    general: "",
  });
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // --- LOGIC XỬ LÝ ON CHANGE ĐỂ XÓA LỖI ---
  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
    setErrors(prev => ({ ...prev, newPassword: "" }));
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setErrors(prev => ({ ...prev, confirmPassword: "" }));
  };

  const handlePhoneNumberChange = (e) => {
    setPhoneNumber(e.target.value);
    setErrors(prev => ({ ...prev, phoneNumber: "" }));
  };
  // ------------------------------------------

  useEffect(() => {
    const jwtToken = localStorage.getItem("jwtToken");
    const requirePasswordSetup =
      localStorage.getItem("requirePasswordSetup") === "true";
    if (!jwtToken) {
      toast.error(t("error.please_login") || "Vui lòng đăng nhập trước");
      navigate("/login", { replace: true });
      return;
    }

    if (!requirePasswordSetup) {
      const role = localStorage.getItem("role");
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
  }, [navigate, t]);

  const validateForm = () => {
    let newErrors = {
      newPassword: "",
      confirmPassword: "",
      phoneNumber: "",
      general: "",
    };
    let isValid = true;
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    const phoneNumberRegex = /^\d{10}$/;

    // Validate New Password
    if (!newPassword.trim()) {
      newErrors.newPassword =
        t("validation.new_password_required") ||
        "Mật khẩu mới không được để trống.";
      isValid = false;
    } else if (!passwordRegex.test(newPassword)) {
      newErrors.newPassword =
        t("validation.password_format") ||
        "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái viết hoa và ký tự đặc biệt.";
      isValid = false;
    }

    // Validate Confirm Password
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword =
        t("validation.confirm_password_required") ||
        "Xác nhận mật khẩu không được để trống.";
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword =
        t("validation.password_mismatch") ||
        "Mật khẩu và xác nhận mật khẩu không khớp.";
      isValid = false;
    }

    // Validate Phone Number
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber =
        t("validation.phone_number_required") ||
        "Số điện thoại không được để trống.";
      isValid = false;
    } else if (!phoneNumberRegex.test(phoneNumber)) {
      newErrors.phoneNumber =
        t("validation.phone_number_format") ||
        "Số điện thoại phải có đúng 10 chữ số.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors(prev => ({ ...prev, general: "" }));
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.addPassword({
        newPassword,
        confirmPassword,
        phoneNumber,
      });

      if (res.success) {
        setSuccess(true);
        localStorage.setItem("requirePasswordSetup", "false");
        onPasswordSetSuccess && onPasswordSetSuccess();

        const role = localStorage.getItem("role");
        setTimeout(() => {
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
        }, 2000);
      } else {
        const apiErrors = res.validationErrors || {};
        const firstError = Object.values(apiErrors)[0] || res.message;

        setErrors((prev) => ({
          ...prev,
          general:
            firstError ||
            t("error.add_password_failed") ||
            "Thêm mật khẩu thất bại.",
        }));
      }
    } catch (err) {
      console.error("Lỗi thêm mật khẩu:", err);
      setErrors((prev) => ({
        ...prev,
        general:
          t("error.unexpected") || "Đã xảy ra lỗi bất ngờ. Vui lòng thử lại.",
      }));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-green-50">
        <div className="p-8 bg-white rounded-3xl shadow-2xl text-center max-w-sm">
          {/* ... Success content remains the same ... */}
          <svg
            className="w-16 h-16 text-green-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {t("ui.password_set_success_title") ||
              "Thiết lập mật khẩu thành công!"}
          </h2>
          <p className="text-gray-600">
            {t("ui.password_set_success_message") ||
              "Bạn đã có thể sử dụng mật khẩu này để đăng nhập."}
          </p>
          <button
            onClick={() => {
              const role = localStorage.getItem("role");
              if (role === "admin") {
                navigate("/admin/dashboard");
              } else if (role === "supporter") {
                navigate("/supporter/tickets");
              } else if (role === "operator") {
                navigate("/operator/customers");
              } else if (role === "equipmentmanager") {
                navigate("/warehouse/equipments");
              } else {
                navigate("/");
              }
            }}
            className="mt-4 text-blue-600 hover:underline"
          >
            {t("ui.go_to_home") || "Về trang chủ"}
          </button>
        </div>
      </div>
    );
  }

  return (
    // Nền chính và hiệu ứng từ LoginPage
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 relative overflow-hidden">
      {/* Animated Background Circles */}
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

      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        {/* Chỉ giữ lại form ở giữa màn hình */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">

            {/* Header Section - Dùng gradient blue-to-cyan */}
            <div className="px-8 pt-8 pb-6 text-center bg-gradient-to-br from-blue-50 to-cyan-50">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                // Gradient blue-to-cyan
                className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg mb-6"
              >
                <Lock className="w-8 h-8 text-white" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                // Tiêu đề với hiệu ứng text gradient
                className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2"
              >
                {t("ui.set_password_title") || "Thiết lập Mật khẩu"}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600"
              >
                {t("ui.set_password_subtitle") ||
                  "Vui lòng thêm mật khẩu và số điện thoại để hoàn tất."}
              </motion.p>
            </div>

            {/* Form Section */}
            <div className="px-8 pb-8 pt-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-gray-100">
               {/* Hiển thị lỗi chung từ API/Hệ thống */}
              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-700">
                  {errors.general}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                 {/* New Password Field */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-semibold text-gray-700">
                    {t("form.label.new_password") || "Mật khẩu mới"}
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={handleNewPasswordChange}
                      placeholder={
                        t("form.placeholder.new_password") ||
                        "Nhập mật khẩu mới (ít nhất 8 ký tự)"
                      }
                      // Thêm hiệu ứng focus blue-500/ring-2
                      className={`w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all ${
                        errors.newPassword ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200'
                      }`}
                      required
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </motion.button>
                  </div>
                  {errors.newPassword && (
                     <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-600 flex items-center gap-1"
                    >
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {errors.newPassword}
                    </motion.p>
                  )}
                </motion.div>

                {/* Confirm Password Field */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-semibold text-gray-700">
                    {t("form.label.confirm_password") || "Xác nhận Mật khẩu"}
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      placeholder={
                        t("form.placeholder.confirm_password") ||
                        "Xác nhận lại mật khẩu"
                      }
                      className={`w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all ${
                        errors.confirmPassword ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200'
                      }`}
                      required
                    />
                     <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </motion.button>
                  </div>
                  {errors.confirmPassword && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-600 flex items-center gap-1"
                    >
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {errors.confirmPassword}
                    </motion.p>
                  )}
                </motion.div>

                {/* Phone Number Field */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-semibold text-gray-700">
                    {t("form.label.phone_number") || "Số điện thoại"}
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      placeholder={
                        t("form.placeholder.phone_number") ||
                        "Nhập số điện thoại (10 chữ số)"
                      }
                      className={`w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all ${
                        errors.phoneNumber ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200'
                      }`}
                      required
                    />
                  </div>
                  {errors.phoneNumber && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-600 flex items-center gap-1"
                    >
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {errors.phoneNumber}
                    </motion.p>
                  )}
                </motion.div>

                {/* Submit Button - Dùng gradient blue-to-cyan */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  // Style gradient blue-to-cyan
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? (
                      <span className="flex items-center justify-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                          {t("ui.setting_password") || "Đang thiết lập..."}
                        </span>
                      ) : (
                        t("ui.set_password_button") || "Hoàn tất & Đăng nhập"
                      )}
                </motion.button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}