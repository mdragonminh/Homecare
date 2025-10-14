import { CheckCircle, XCircle, Home, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { profileApi } from "../../services/profileApi";

const ConfirmEmailChangePage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("ready"); // "ready", "loading", "success", "error"
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Liên kết không hợp lệ hoặc đã hết hạn");
    } else {
      setStatus("ready");
      setMessage("Sẵn sàng xác nhận thay đổi email");
    }
  }, [searchParams]);

  useEffect(() => {
    // Countdown và redirect nếu thành công
    if (status === "success" && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (status === "success" && countdown === 0) {
      navigate("/profile");
    }
  }, [status, countdown, navigate]);

  const confirmEmailChange = async () => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Không tìm thấy token xác thực");
      return;
    }

    setStatus("loading");
    setMessage("Đang xác thực...");

    try {
      const result = await profileApi.confirmEmailChange(token);

      if (result.success) {
        setStatus("success");
        setMessage(result.message || "Email đã được thay đổi thành công!");
        toast.success("Email đã được cập nhật thành công!");
      } else {
        setStatus("error");
        setMessage(result.message || "Có lỗi xảy ra khi xác nhận email");
        toast.error(result.message || "Xác nhận email thất bại");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Không thể kết nối đến server");
      toast.error("Lỗi kết nối");
    }
  };

  const handleRetryConfirm = () => {
    confirmEmailChange();
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const handleGoToProfile = () => {
    navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {t("ui.confirm_email_change")}
            </h2>
            <p className="text-gray-600">{t("ui.email_change_verification")}</p>
          </div>

          {/* Content based on status */}
          <div className="text-center">
            {status === "ready" && (
              <div className="space-y-4">
                <CheckCircle className="h-16 w-16 text-blue-500 mx-auto" />
                <h3 className="text-lg font-medium text-gray-900">
                  {t("ui.ready_to_confirm")}
                </h3>
                <p className="text-gray-600">
                  {t("ui.click_confirm_to_change_email")}
                </p>
              </div>
            )}

            {status === "loading" && (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                <h3 className="text-lg font-medium text-gray-900">
                  {t("ui.verifying_email_change")}
                </h3>
                <p className="text-gray-600">{t("ui.please_wait_verifying")}</p>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <h3 className="text-lg font-medium text-green-900">
                  {t("ui.email_change_success")}
                </h3>
                <p className="text-gray-600">{message}</p>
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-green-700 text-sm">
                    {t("ui.redirecting_to_profile_in")} {countdown}{" "}
                    {t("ui.seconds")}...
                  </p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                <h3 className="text-lg font-medium text-red-900">
                  {t("ui.email_change_failed")}
                </h3>
                <p className="text-gray-600">{message}</p>
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-700 text-sm">
                    {t("ui.email_change_error_help")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            {status === "ready" && (
              <button
                onClick={confirmEmailChange}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {t("ui.confirm_email_change_button")}
              </button>
            )}

            {status === "success" && (
              <button
                onClick={handleGoToProfile}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {t("ui.go_to_profile")}
              </button>
            )}

            {status === "error" && (
              <>
                <button
                  onClick={handleRetryConfirm}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t("ui.try_again")}
                </button>
                <button
                  onClick={handleGoToProfile}
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Home className="w-4 h-4 mr-2" />
                  {t("ui.go_to_profile")}
                </button>
              </>
            )}

            <button
              onClick={handleGoHome}
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Home className="w-4 h-4 mr-2" />
              {t("ui.back_to_home")}
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            {t("ui.email_change_help_text")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmailChangePage;
