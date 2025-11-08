import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Eye, EyeOff, Key } from "lucide-react";

const ChangePasswordModal = ({ isOpen, onClose, onSubmit, isCancellable = true }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name] || errors.general) { 
      setErrors(prev => ({
        ...prev,
        [name]: "",
        general: "", 
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateNewPassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength) {
      errors.push(t("ui.change_password_modal.error_min_length"));
    }
    if (!hasUpperCase) {
      errors.push(t("ui.change_password_modal.error_uppercase"));
    }
    if (!hasLowerCase) {
      errors.push(t("ui.change_password_modal.error_lowercase"));
    }
    if (!hasNumber) {
      errors.push(t("ui.change_password_modal.error_number"));
    }
    if (!hasSpecialChar) {
      errors.push(t("ui.change_password_modal.error_special_char"));
    }
    return errors;
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = t("ui.change_password_modal.error_current_required");
    }
    
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = t("ui.change_password_modal.error_new_required");
    } else {
      const passwordErrors = validateNewPassword(formData.newPassword);
      if (passwordErrors.length > 0) {
        newErrors.newPassword = passwordErrors.join(" ");
      }
    }
    
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = t("ui.change_password_modal.error_confirm_required");
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t("ui.change_password_modal.error_confirm_mismatch");
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = t("ui.change_password_modal.error_new_same");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      await onSubmit(formData.currentPassword, formData.newPassword, formData.confirmPassword);
      
      if (isCancellable) {
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setErrors({});
        onClose();
      }      
    } catch (error) {
      setErrors({
        general: error.message || t("ui.change_password_modal.error_general"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && isCancellable) {
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({});
      setShowPasswords({
        current: false,
        new: false,
        confirm: false,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{background: 'rgba(1,1,1, 0.5)'}} className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Key className="w-5 h-5 text-red-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">{t("ui.change_password_modal.title")}</h2>
          </div>
          
          {isCancellable && (
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
{errors.general && (
  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
    {t("ui.change_password_modal.errors_general")} *
  </div>
)}

          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("ui.change_password_modal.current_password")} *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.currentPassword ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={t("ui.change_password_modal.current_password_placeholder")}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("ui.change_password_modal.new_password")} *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.newPassword ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={t("ui.change_password_modal.new_password_placeholder")}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("ui.change_password_modal.confirm_password")} *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.confirmPassword ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={t("ui.change_password_modal.confirm_password_placeholder")}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>{t("ui.change_password_modal.note_title") || "Lưu ý:"}</strong> {t("ui.change_password_modal.note")}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            
            {isCancellable && (
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("ui.change_password_modal.cancel")}
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center ${
                isCancellable ? 'flex-1' : 'w-full'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t("ui.change_password_modal.processing")}
                </>
              ) : (
                t("ui.change_password_modal.submit")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
