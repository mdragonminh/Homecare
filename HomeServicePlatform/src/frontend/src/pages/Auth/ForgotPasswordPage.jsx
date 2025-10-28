
import { useState } from 'react';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { authApi } from '../../services/authApi';
import { useTranslation } from 'react-i18next'; 
import LanguageSwitcher from '../../components/LanguageSwitcher.jsx'; 

export default function ForgotPasswordPage({ onSwitchToLogin }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); 
  const [validationError, setValidationError] = useState({}); 

 
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 

  const handleValidation = () => {
    let errors = {};
    let formIsValid = true;
    if (!email) {
      formIsValid = false;
      errors.email = t('validation.email_required') || "Vui lòng nhập địa chỉ email.";
    } else if (!emailRegex.test(email)) {
      formIsValid = false;
      errors.email = t('validation.email_invalid_format') || "Địa chỉ email không đúng định dạng.";
    }

    setValidationError(errors);
    return formIsValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    setValidationError({});
    if (!handleValidation()) {
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.requestPasswordReset({ email });

      if (res.success) {
        setMessage(res.message);
        setMessageType('success');
      } else {
        setMessage(res.message); 
        setMessageType('error');
      }
    } catch (err) {
        console.error("Reset password error:", err);
      setMessage(t('error.network_connect_failed') || "Lỗi kết nối mạng.");
      setMessageType('error');
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
        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md">
          
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('ui.forgot_password') || "Quên Mật Khẩu"}</h2>
            <p className="text-gray-500 text-sm">
              {t('ui.forgot_password_instruction') || "Nhập email của bạn để nhận liên kết đặt lại mật khẩu."}
            </p>
          </div>
          {(message && messageType) && (
            <div className={`p-4 mb-4 rounded-xl text-sm font-medium ${messageType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                {t('form.label.email') || "Địa chỉ Email"}
              </label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${validationError.email ? 'text-red-400' : 'text-gray-400'}`} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('form.placeholder.email') || "example@email.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${validationError.email ? 'border-red-500 focus:border-red-500' : 'border-gray-200'}`}
                  disabled={loading || messageType === 'success'}
                  autoComplete="off"
                />
              </div>
              {validationError.email && (
                <p className="text-red-500 text-xs mt-1">{validationError.email}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || messageType === 'success'}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('ui.sending_request') || "Đang gửi yêu cầu..."}</span>
                </div>
              ) : (
                t('ui.send_reset_link') || "Gửi Liên Kết Đặt Lại Mật Khẩu"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              className="flex items-center mx-auto text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
              onClick={onSwitchToLogin}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t('ui.back_to_login') || "Quay lại trang Đăng nhập"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}