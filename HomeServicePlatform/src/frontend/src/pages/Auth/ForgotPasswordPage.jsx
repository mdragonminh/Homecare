import { useState } from 'react';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { authApi } from '../../services/authApi';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher.jsx';
// eslint-disable-next-line
import { motion } from 'framer-motion'; // Import framer-motion

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

  // Hàm xử lý khi gõ để xóa lỗi validation
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    // Xóa lỗi ngay khi người dùng bắt đầu gõ
    setValidationError(prev => ({ ...prev, email: "" }));
  };

  return (
    // 1. Nền chính và hiệu ứng từ LoginPage
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

      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

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
                <Mail className="w-8 h-8 text-white" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              // Tiêu đề sử dụng gradient
              className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2"
            >
              {t('ui.forgot_password') || "Quên Mật Khẩu"}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 text-sm"
            >
              {t('ui.forgot_password_instruction') || "Nhập email của bạn để nhận liên kết đặt lại mật khẩu."}
            </motion.p>
          </div>

          {(message && messageType) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`p-4 mb-4 rounded-xl text-sm font-medium ${messageType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
            >
              {message}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-1"
            >
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                {t('form.label.email') || "Địa chỉ Email"}
              </label>
              <div className="relative group">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors ${validationError.email ? 'text-red-400' : 'text-gray-400'}`} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('form.placeholder.email') || "example@email.com"}
                  value={email}
                  // Sử dụng hàm mới để xóa lỗi
                  onChange={handleEmailChange} 
                  className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all ${validationError.email ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200'}`}
                  disabled={loading || messageType === 'success'}
                  autoComplete="off"
                />
              </div>
              {validationError.email && (
                 <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 flex items-center gap-1 mt-1"
                  >
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {validationError.email}
                  </motion.p>
              )}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || messageType === 'success'}
              // Sử dụng gradient blue-to-cyan
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('ui.sending_request') || "Đang gửi yêu cầu..."}</span>
                </div>
              ) : (
                t('ui.send_reset_link') || "Gửi Liên Kết Đặt Lại Mật Khẩu"
              )}
            </motion.button>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 text-center"
          >
            <motion.button
              whileHover={{ x: -3 }}
              className="flex items-center mx-auto text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
              onClick={onSwitchToLogin}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t('ui.back_to_login') || "Quay lại trang Đăng nhập"}
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}