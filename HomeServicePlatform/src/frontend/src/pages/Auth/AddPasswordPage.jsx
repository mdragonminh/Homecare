import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../services/authApi.jsx";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function AddPasswordPage({ onPasswordSetSuccess }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      navigate("/", { replace: true });
    }
  }, [navigate, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!newPassword.trim()) {
      setError(
        t("validation.new_password_required") ||
          "Mật khẩu mới không được để trống."
      );
      return;
    }
    if (!confirmPassword.trim()) {
      setError(
        t("validation.confirm_password_required") ||
          "Xác nhận mật khẩu không được để trống."
      );
      return;
    }
    if (!phoneNumber.trim()) {
      setError(
        t("validation.phone_number_required") ||
          "Số điện thoại không được để trống."
      );
      return;
    }
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError(
        t("validation.password_format") ||
          "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái viết hoa và ký tự đặc biệt."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        t("validation.password_mismatch") ||
          "Mật khẩu và xác nhận mật khẩu không khớp."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.addPassword({ newPassword, confirmPassword,phoneNumber });

      if (res.success) {
        setSuccess(true);
        localStorage.setItem("requirePasswordSetup", "false");
        onPasswordSetSuccess && onPasswordSetSuccess();
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 2000);
      } else {
        const errors = res.validationErrors || {};
        const firstError = Object.values(errors)[0] || res.message;
        setError(
          firstError ||
            t("error.add_password_failed") ||
            "Thêm mật khẩu thất bại."
        );
      }
    } catch (err) {
      console.error("Lỗi thêm mật khẩu:", err);
      setError(
        t("error.unexpected") || "Đã xảy ra lỗi bất ngờ. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-green-50">
        <div className="p-8 bg-white rounded-3xl shadow-2xl text-center max-w-sm">
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
            onClick={() => navigate("/")}
            className="mt-4 text-blue-600 hover:underline"
          >
            {t("ui.go_to_home") || "Về trang chủ"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-white to-orange-50 relative">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-8 pt-8 pb-6 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg mb-6">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t("ui.set_password_title") || "Thiết lập Mật khẩu"}
          </h2>
          <p className="text-gray-500 mb-8">
            {t("ui.set_password_subtitle") ||
              "Vui lòng thêm mật khẩu để hoàn tất tạo tài khoản."}
          </p>
        </div>

        <div className="px-8 pb-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {t("form.label.new_password") || "Mật khẩu mới"}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={
                    t("form.placeholder.new_password") ||
                    "Nhập mật khẩu mới (ít nhất 8 ký tự)"
                  }
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {t("form.label.confirm_password") || "Xác nhận Mật khẩu"}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={
                    t("form.placeholder.confirm_password") ||
                    "Xác nhận lại mật khẩu"
                  }
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {t("form.label.phone_number") || "Số điện thoại"} {/* <-- NHÃN MỚI */}
              </label>
              <div className="relative">
                {/* Bạn có thể dùng Phone hoặc một icon phù hợp */}
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-7.53-7.53A19.79 19.79 0 0 1 2 4.18 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72 17 17 0 0 0 .8 3.55 1 1 0 0 1-.29 1.05l-1.88 1.88a15.15 15.15 0 0 0 7.53 7.53l1.88-1.88a1 1 0 0 1 1.05-.29 17 17 0 0 0 3.55.8 2 2 0 0 1 1.72 2z"/></svg>

                <input
                  type="tel" // Sử dụng type="tel" cho số điện thoại
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={
                    t("form.placeholder.phone_number") ||
                    "Nhập số điện thoại"
                  }
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-3 focus:ring-blue-500/20 transform hover:scale-[1.02] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading
                ? t("ui.setting_password") || "Đang thiết lập..."
                : t("ui.set_password_button") || "Hoàn tất & Đăng nhập"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
