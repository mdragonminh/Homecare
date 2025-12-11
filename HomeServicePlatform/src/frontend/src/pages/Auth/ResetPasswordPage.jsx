import { useState, useEffect } from "react";
import { Lock, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react"; // Import ArrowLeft
import { authApi } from "../../services/authApi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher.jsx";
// eslint-disable-next-line
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [validationError, setValidationError] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const userId = searchParams.get("userId");
  const token = searchParams.get("token");
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

  useEffect(() => {
    const existingToken = localStorage.getItem("jwtToken");
    if (existingToken) {
      localStorage.removeItem("jwtToken");
      localStorage.removeItem("refreshToken");
    }

    if (!userId || !token) {
      // Nếu thiếu userId hoặc token, chuyển hướng về trang quên mật khẩu
      navigate("/forgot-password", { replace: true });
      return;
    }
  }, [userId, token, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Xóa lỗi ngay khi người dùng gõ
    setValidationError((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const handleValidation = () => {
    let errors = {};
    let formIsValid = true;

    // Validate New Password
    if (!formData.newPassword) {
      formIsValid = false;
      errors.newPassword =
        t("validation.password_required") || "Vui lòng nhập mật khẩu mới.";
    } else if (!passwordRegex.test(formData.newPassword)) {
      formIsValid = false;
      errors.newPassword =
        t("validation.password_strong") ||
        "Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường và số.";
    }

    // Validate Confirm Password
    if (!formData.confirmPassword) {
      formIsValid = false;
      errors.confirmPassword =
        t("validation.confirm_password_required") ||
        "Vui lòng xác nhận mật khẩu.";
    } else if (formData.newPassword !== formData.confirmPassword) {
      formIsValid = false;
      errors.confirmPassword =
        t("validation.password_mismatch") ||
        "Mật khẩu mới và xác nhận mật khẩu không khớp.";
    }

    setValidationError(errors);
    return formIsValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!handleValidation()) {
      return;
    }

    if (!userId || !token) {
      setMessage(
        t("error.invalid_reset_link") ||
          "Liên kết đặt lại mật khẩu không hợp lệ."
      );
      setMessageType("error");
      setTimeout(() => {
        navigate("/forgot-password", { replace: true });
      }, 1500);
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.resetPassword({
        userId,
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      if (res.success) {
        setMessage(res.message || t("ui.reset_password_success") || "Đặt lại mật khẩu thành công!");
        setMessageType("success");
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("refreshToken");

        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
      } else {
        setMessage(res.message || t("ui.reset_password_failed") || "Đặt lại mật khẩu thất bại.");
        setMessageType("error");

        if (
          res.errorCode === "TOKEN_EXPIRED" ||
          res.errorCode === "INVALID_TOKEN"
        ) {
          setTimeout(() => {
            navigate("/forgot-password", { replace: true });
          }, 3000);
        }
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setMessage(t("error.network_connect_failed") || "Lỗi kết nối mạng.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    // 1. Nền chính và hiệu ứng từ LoginPage (blue-cyan)
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

      {/* <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div> */}

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          // Card mới với blur và shadow-2xl
          className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 w-full max-w-md"
        >
          <div className="text-center mb-8">
             <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                // Gradient blue-to-cyan cho icon
                className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg mb-6"
            >
                <Lock className="w-8 h-8 text-white" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              // Tiêu đề sử dụng gradient
              className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2"
            >
              {t("ui.reset_password_title") || "Đặt Lại Mật Khẩu"}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 text-sm"
            >
              {t("ui.reset_password_tagline") ||
                "Vui lòng nhập mật khẩu mới của bạn."}
            </motion.p>
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`p-4 mb-4 rounded-xl text-sm font-medium ${
                messageType === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* --- Input Mật khẩu mới --- */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-1"
            >
              <label
                htmlFor="newPassword"
                className="block text-sm font-semibold text-gray-700"
              >
                {t("form.label.new_password") || "Mật khẩu mới"}
              </label>
              <div className="relative group">
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors ${
                    validationError.newPassword ? "text-red-400" : ""
                  }`}
                />
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    t("form.placeholder.password") ||
                    "Mật khẩu (ít nhất 6 ký tự, có hoa, thường, số)"
                  }
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  // Styling mới
                  className={`w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all ${
                    validationError.newPassword
                      ? "border-red-400 ring-2 ring-red-200"
                      : "border-gray-200"
                  }`}
                  disabled={loading || messageType === "success"}
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
              {validationError.newPassword && (
                <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 flex items-center gap-1 mt-1"
                  >
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {validationError.newPassword}
                </motion.p>
              )}
            </motion.div>

            {/* --- Input Xác nhận mật khẩu --- */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-1"
            >
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-gray-700"
              >
                {t("form.label.confirm_password") || "Xác nhận mật khẩu mới"}
              </label>
              <div className="relative group">
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors ${
                    validationError.confirmPassword ? "text-red-400" : ""
                  }`}
                />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={
                    t("form.placeholder.confirm_password") ||
                    "Nhập lại mật khẩu mới"
                  }
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  // Styling mới
                  className={`w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all ${
                    validationError.confirmPassword
                      ? "border-red-400 ring-2 ring-red-200"
                      : "border-gray-200"
                  }`}
                  disabled={loading || messageType === "success"}
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
              {validationError.confirmPassword && (
                <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 flex items-center gap-1 mt-1"
                  >
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {validationError.confirmPassword}
                </motion.p>
              )}
            </motion.div>

            {/* --- Submit Button --- */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || messageType === "success"}
              // Sử dụng gradient blue-to-cyan
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t("ui.processing") || "Đang xử lý..."}</span>
                </div>
              ) : (
                t("ui.reset_password_button_submit") || "Đặt Lại Mật Khẩu"
              )}
            </motion.button>
          </form>

          {/* Nút Quay lại Đăng nhập được đưa vào bên trong thẻ chính */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-center"
          >
            <motion.button
              whileHover={{ x: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/login")}
              className="flex items-center mx-auto text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t("ui.back_to_login") || "Quay lại trang Đăng nhập"}
            </motion.button>
          </motion.div>
        </motion.div>
        {/* Xóa div thừa ở đây */}
      </div>
    </div>
  );
}