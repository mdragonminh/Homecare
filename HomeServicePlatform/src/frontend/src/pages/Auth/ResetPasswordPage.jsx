import { useState, useEffect } from "react";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { authApi } from "../../services/authApi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher.jsx";

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
      navigate("/forgot-password", { replace: true });
      return;
    }
  }, [userId, token, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setValidationError((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const handleValidation = () => {
    let errors = {};
    let formIsValid = true;

    if (!formData.newPassword) {
      formIsValid = false;
      errors.newPassword =
        t("validation.password_required") ||
        "Vui lòng nhập mật khẩu mới.";
    } else if (formData.newPassword.length < 6) {
      formIsValid = false;
      errors.newPassword =
        t("validation.password_min_length", { min: 6 }) ||
        "Mật khẩu phải có ít nhất 6 ký tự.";
    } else if (!passwordRegex.test(formData.newPassword)) {
      formIsValid = false;
      errors.newPassword =
        t("validation.password_strong") ||
        "Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường và số.";
    }

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
        setMessage(res.message);
        setMessageType("success");
        localStorage.removeItem("jwtToken"); 
        localStorage.removeItem("refreshToken"); 

        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
      } else {
        setMessage(res.message);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 relative">
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 w-full max-w-sm">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {t("ui.reset_password_title") || "Đặt Lại Mật Khẩu"}
            </h2>
            <p className="text-gray-500 text-sm">
              {t("ui.reset_password_tagline") ||
                "Vui lòng nhập mật khẩu mới của bạn."}
            </p>
          </div>

          {message && (
            <div
              className={`p-4 mb-4 rounded-xl text-sm font-medium ${
                messageType === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* --- Input Mật khẩu mới --- */}
            <div className="space-y-1">
              <label
                htmlFor="newPassword"
                className="block text-sm font-semibold text-gray-700"
              >
                {t("form.label.new_password") || "Mật khẩu mới"}
              </label>
              <div className="relative">
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    validationError.newPassword
                      ? "text-red-400"
                      : "text-gray-400"
                  }`}
                />
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    t("form.placeholder.password") || "Nhập mật khẩu mới"
                  }
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-12 py-3 bg-gray-50 border rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    validationError.newPassword
                      ? "border-red-500"
                      : "border-gray-200"
                  }`}
                  disabled={loading || messageType === "success"}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {validationError.newPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {validationError.newPassword}
                </p>
              )}
            </div>

            {/* --- Input Xác nhận mật khẩu --- */}
            <div className="space-y-1">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-gray-700"
              >
                {t("form.label.confirm_password") || "Xác nhận mật khẩu mới"}
              </label>
              <div className="relative">
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    validationError.confirmPassword
                      ? "text-red-400"
                      : "text-gray-400"
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
                  className={`w-full pl-12 pr-12 py-3 bg-gray-50 border rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    validationError.confirmPassword
                      ? "border-red-500"
                      : "border-gray-200"
                  }`}
                  disabled={loading || messageType === "success"}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {validationError.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {validationError.confirmPassword}
                </p>
              )}
            </div>

            {/* --- Submit Button --- */}
            <button
              type="submit"
              disabled={loading || messageType === "success"}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t("ui.processing") || "Đang xử lý..."}</span>
                </div>
              ) : (
                t("ui.reset_password_button_submit") || "Đặt Lại Mật Khẩu"
              )}
            </button>
          </form>
        </div>
        {messageType === "error" && (
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate("/forgot-password")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              {t("ui.back_to_forgot_password") ||
                "← Quay lại trang Quên mật khẩu"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}