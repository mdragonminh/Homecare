import {
  Edit,
  Home,
  Key,
  MapPin,
  Save,
  X,
  Check,
  Mail,
  User,
  RefreshCw,
  AlertCircle,
  Camera,
  Upload,
  Trash2,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ChangePasswordModal from "../components/ChangePasswordModal";
import DeleteAvatarModal from "../components/DeleteAvatarModal";
import { Footer } from "../components/Footer";
import { profileApi } from "../services/profileApi";

const Profile = ({ loggedInUser, onLogout, onShowLogin, onShowRegister }) => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
  });
  const [emailVerificationPending, setEmailVerificationPending] =
    useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showDeleteAvatarModal, setShowDeleteAvatarModal] = useState(false);

  // Hàm validate Full Name
  const validateFullName = useCallback(
    (value) => {
      if (!value || value.trim() === "") {
        return t("ui.validation.fullname.required");
      }
      if (value.trim().length < 2) {
        return t("ui.validation.fullname.min_length");
      }
      if (value.trim().length > 100) {
        return t("ui.validation.fullname.max_length");
      }
      if (/\s{2,}/.test(value)) {
        return t("ui.validation.fullname.no_consecutive_spaces");
      }
      if (!/^[a-zA-ZÀ-ỿ0-9\s]+$/.test(value.trim())) {
        return t("ui.validation.fullname.invalid_chars");
      }
      return "";
    },
    [t]
  );

// Hàm validate Email
const validateEmail = useCallback(
  (value) => {
    if (!value || value.trim() === "") {
      return t("ui.validation.email.required");
    }

    // Kiểm tra có bất kỳ khoảng trắng nào trong toàn bộ chuỗi (kể cả đầu, giữa, cuối)
    if (/\s/.test(value)) {
      return t("ui.validation.email.no_spaces");
    }

    // Kiểm tra định dạng email với regex chặt chẽ
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(value)) {
      return t("ui.validation.email.invalid_format");
    }

if ((value.match(/@/g) || []).length !== 1) {
  return t("ui.validation.email.single_at_required");
}

const domainParts = value.split('@')[1];
if ((domainParts.match(/\./g) || []).length < 1) {
  return t("ui.validation.email.dot_required");
}

    if (value.length > 100) {
      return t("ui.validation.email.max_length");
    }

    return "";
  },
  [t]
);

  // Hàm validate Phone Number
  const validatePhoneNumber = useCallback(
    (value) => {
      if (!value || value.trim() === "") {
        return t("ui.validation.phone.required");
      }
      // Kiểm tra khoảng trắng trước khi kiểm tra định dạng
      if (value !== value.trim()) {
        return t("ui.validation.phone.no_spaces");
      }
      const phoneRegex = /^0\d{9,10}$/;
      if (!phoneRegex.test(value)) {
        return t("ui.validation.phone.invalid_format");
      }
      return "";
    },
    [t]
  );

  useEffect(() => {
    fetchProfile();

    const urlParams = new URLSearchParams(window.location.search);
    const emailChanged = urlParams.get("emailChanged");
    const message = urlParams.get("message");

    if (emailChanged !== null && message) {
      if (emailChanged === "true") {
        toast.success(decodeURIComponent(message));
        setEmailVerificationPending(false);
        setTimeout(() => {
          fetchProfile();
        }, 1000);
      } else {
        toast.error(decodeURIComponent(message));
      }

      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (profile && editingField === null) {
      setEditForm({
        fullName: profile.fullName || "",
        phoneNumber: profile.phoneNumber || "",
        email: profile.email || "",
      });
      setErrors({
        fullName: "",
        email: "",
        phoneNumber: "",
      });
    }
  }, [profile, editingField]);

  // Cập nhật lại các lỗi validate khi ngôn ngữ thay đổi
  useEffect(() => {
    if (editingField && editForm) {
      // Chỉ validate lại khi đang trong chế độ chỉnh sửa
      const newErrors = {
        fullName:
          editingField === "fullName"
            ? validateFullName(editForm.fullName)
            : "",
        email: editingField === "email" ? validateEmail(editForm.email) : "",
        phoneNumber:
          editingField === "phoneNumber"
            ? validatePhoneNumber(editForm.phoneNumber)
            : "",
      };
      setErrors(newErrors);
    }
  }, [
    t,
    editingField,
    editForm,
    validateFullName,
    validateEmail,
    validatePhoneNumber,
  ]);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await profileApi.getMyProfile();
      if (result.success) {
        setProfile(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(t("ui.error_loading_profile"));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
  };

  const handleChangePasswordSubmit = async (
    currentPassword,
    newPassword,
    confirmNewPassword
  ) => {
    const result = await profileApi.changePassword(
      currentPassword,
      newPassword,
      confirmNewPassword
    );
    if (result.success) {
      toast.success(t("success.password_changed"));
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } else {
      throw new Error(result.message);
    }
  };

  const handleEditField = (fieldName) => {
    setEditingField(fieldName);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEmailVerificationPending(false);
    setEditForm({
      fullName: profile.fullName || "",
      phoneNumber: profile.phoneNumber || "",
      email: profile.email || "",
    });
    setErrors({
      fullName: "",
      email: "",
      phoneNumber: "",
    });
  };

  const handleInputChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Validate ngay khi nhập
    let error = "";
    if (field === "fullName") {
      error = validateFullName(value);
    } else if (field === "email") {
      error = validateEmail(value);
    } else if (field === "phoneNumber") {
      error = validatePhoneNumber(value);
    }

    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      // Validate tất cả trường trước khi lưu
      const fullNameError = validateFullName(editForm.fullName);
      const emailError = validateEmail(editForm.email);
      const phoneError = validatePhoneNumber(editForm.phoneNumber);

      setErrors({
        fullName: fullNameError,
        email: emailError,
        phoneNumber: phoneError,
      });

      // Nếu có lỗi, dừng lại
      if (fullNameError || emailError || phoneError) {
        return;
      }

      const fieldToUpdate = editingField;

      if (fieldToUpdate === "fullName" || fieldToUpdate === "phoneNumber") {
        const updateResult = await profileApi.updateMyProfile(
          editForm.fullName,
          editForm.phoneNumber
        );

        if (!updateResult.success) {
          throw new Error(updateResult.message);
        }

        setProfile((prev) => ({
          ...prev,
          fullName: editForm.fullName,
          phoneNumber: editForm.phoneNumber,
        }));

        setEditingField(null);
        toast.success(t("success.profile_updated"));
      } else if (fieldToUpdate === "email") {
        if (editForm.email !== profile.email) {
          const emailResult = await profileApi.requestEmailChange(
            editForm.email
          );
          if (emailResult.success) {
            setEmailVerificationPending(true);
            toast.success(t("success.profile_updated_email_pending"));
          } else {
            throw new Error(emailResult.message);
          }
        } else {
          setEditingField(null);
          toast.success(t("success.profile_updated"));
        }
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Xử lý upload avatar
  const handleAvatarUpload = async (file) => {
    if (!file) return;

    // Kiểm tra loại file (khớp với controller)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("ui.avatar_invalid_format"));
      return;
    }

    // Kiểm tra kích thước file (max 5MB - khớp với controller)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error(t("ui.avatar_too_large"));
      return;
    }

    setUploadingAvatar(true);
    try {
      const result = await profileApi.uploadAvatar(file);
      if (result.success) {
        toast.success(result.message);
        // Cập nhật profile với avatar mới
        await fetchProfile();
        setAvatarFile(null);
        setAvatarPreview(null);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Xử lý xóa avatar
  const handleDeleteAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const result = await profileApi.deleteAvatar();
      if (result.success) {
        toast.success(result.message);
        await fetchProfile();
        setShowDeleteAvatarModal(false);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Hiển thị modal xác nhận xóa avatar
  const handleShowDeleteAvatarModal = () => {
    setShowDeleteAvatarModal(true);
  };

  // Xử lý chọn file avatar
  const handleAvatarFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Kiểm tra validation trước khi set file
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error(t("ui.avatar_invalid_format"));
        event.target.value = ""; // Reset input
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error(t("ui.avatar_too_large"));
        event.target.value = ""; // Reset input
        return;
      }

      setAvatarFile(file);

      // Tạo preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Hủy chọn avatar
  const handleCancelAvatarUpload = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  // Helper function để tạo full URL cho avatar
  const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl) return null;

    // Nếu đã là URL đầy đủ thì return luôn
    if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
      return avatarUrl;
    }

    // Nếu là đường dẫn tương đối từ API thì tạo full URL
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    // Remove '/api' from API_URL nếu có vì avatar path không có api prefix
    const baseUrl = API_URL.replace("/api", "");
    return `${baseUrl}${avatarUrl}`;
  };

  const LoadingContent = () => (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-lg animate-pulse"></div>
          <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600 border-l-blue-600 mx-auto shadow-xl"></div>
        </div>
        <p className="mt-6 text-lg font-medium text-gray-600 animate-pulse">
          {t("ui.loading_profile")}
        </p>
      </div>
    </div>
  );

  const ErrorContent = () => (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 shadow-lg px-8 py-6 rounded-xl max-w-md transform transition-all duration-300 hover:shadow-xl">
          <p className="font-bold text-xl text-red-700 mb-3">
            {t("ui.error_occurred")}
          </p>
          <p className="text-red-600 text-lg">{error}</p>
        </div>
        <button
          onClick={fetchProfile}
          className="mt-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2 mx-auto"
        >
          <RefreshCw className="w-5 h-5" />
          {t("ui.try_again")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t("ui.personal_information")}
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            {t("ui.view_manage_profile")}
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && <LoadingContent />}
        {error && !loading && <ErrorContent />}

        {!loading && !error && profile && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Profile Card */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex flex-col items-center">
                  {/* Avatar Section */}
                  <div className="relative group mb-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center text-white text-3xl font-bold">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : profile.avatarUrl ? (
                        <img
                          src={getAvatarUrl(profile.avatarUrl)}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback nếu không load được ảnh
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : profile.fullName ? (
                        profile.fullName.charAt(0).toUpperCase()
                      ) : (
                        "U"
                      )}
                      {/* Fallback text khi ảnh lỗi */}
                      {profile.avatarUrl && (
                        <div
                          className="w-full h-full flex items-center justify-center text-white text-3xl font-bold bg-gray-300"
                          style={{ display: "none" }}
                        >
                          {profile.fullName
                            ? profile.fullName.charAt(0).toUpperCase()
                            : "U"}
                        </div>
                      )}
                    </div>

                    {/* Avatar Upload Controls */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="flex gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif"
                            onChange={handleAvatarFileChange}
                            className="hidden"
                            disabled
                          />
                          <Camera className="w-5 h-5 text-white hover:text-blue-300 transition-colors duration-200" />
                        </label>
                        {(profile.avatarUrl || avatarPreview) && (
                          <button
                            onClick={handleShowDeleteAvatarModal}
                            disabled={uploadingAvatar}
                            className="text-white hover:text-red-300 transition-colors duration-200"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Loading overlay */}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                      </div>
                    )}
                  </div>

                  {/* Avatar Upload Preview Actions */}
                  {avatarFile && (
                    <div className="w-full mb-4">
                      {/* File info */}
                      <div className="text-center mb-2">
                        <p className="text-xs text-gray-600">
                          {avatarFile.name} (
                          {(avatarFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      </div>
                      {/* Action buttons */}
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleAvatarUpload(avatarFile)}
                          disabled={uploadingAvatar}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                        >
                          <Upload className="w-4 h-4" />
                          {t("ui.upload")}
                        </button>
                        <button
                          onClick={handleCancelAvatarUpload}
                          disabled={uploadingAvatar}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          {t("ui.change_password_modal.cancel")}
                        </button>
                      </div>
                    </div>
                  )}

                  <h2 className="text-xl font-bold text-gray-900 text-center">
                    {profile.fullName}
                  </h2>
                  <p className="text-gray-600 text-sm text-center mt-2 break-all">
                    {profile.email}
                  </p>
                  <div className="mt-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 gap-1">
                      <Check className="w-3 h-3" />
                      {t("ui.account_verified")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl">
                <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
                  {t("ui.quick_actions") || "Tác vụ nhanh"}
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => (window.location.href = "/list-home")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium border border-transparent hover:border-blue-100 bg-blue-50 text-blue-700 transition-all duration-200 group hover:bg-blue-100"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {t("ui.manage_addresses")}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={handleChangePassword}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium border border-transparent hover:border-rose-100 bg-rose-50 text-rose-700 transition-all duration-200 group hover:bg-rose-100"
                  >
                    <div className="p-2 bg-rose-100 rounded-lg group-hover:bg-rose-200 transition-colors duration-200">
                      <Key className="w-5 h-5 text-rose-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {t("ui.change_password")}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* System Info */}
              <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
                  {t("ui.system_information")}
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-600 font-medium">
                      {t("ui.total_homes")}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Home className="w-5 h-5 text-gray-400" />
                      <p className="text-black-900 font-semibold">
                        {profile.totalHomes || 0} {t("ui.homes")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeTab === "info" && (
                <div className="bg-white rounded-lg shadow-sm">
                  {/* Tabs Navigation */}
                  <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center gap-8">
                      <button className="text-blue-600 font-semibold pb-4 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {t("ui.personal_information")}
                      </button>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="p-6">
                    <div className="space-y-6">
                      {/* Full Name */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <User className="w-4 h-4" /> {t("ui.full_name")}
                        </label>
                        {editingField === "fullName" ? (
                          <div>
                            <input
                              type="text"
                              value={editForm.fullName}
                              onChange={(e) =>
                                handleInputChange("fullName", e.target.value)
                              }
                              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent shadow-sm hover:border-blue-300 transition-all duration-300 ${
                                errors.fullName
                                  ? "border-red-500 focus:ring-red-500"
                                  : "border-gray-300 focus:ring-blue-500"
                              }`}
                              placeholder={t("ui.enter_full_name")}
                            />
                            {errors.fullName && (
                              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <p className="text-sm text-red-700 font-medium">
                                  {errors.fullName}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className="flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 cursor-pointer group"
                            onClick={() => handleEditField("fullName")}
                          >
                            <p className="text-gray-900 group-hover:text-blue-600">
                              {profile.fullName || t("ui.not_updated")}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditField("fullName");
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <Mail className="w-4 h-4" /> Email
                        </label>
                        {editingField === "email" ? (
                          <div>
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) =>
                                handleInputChange("email", e.target.value)
                              }
                              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                                errors.email
                                  ? "border-red-500 focus:ring-red-500"
                                  : "border-gray-300 focus:ring-blue-500"
                              }`}
                              placeholder={t("ui.enter_email")}
                            />
                            {errors.email && (
                              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <p className="text-sm text-red-700 font-medium">
                                  {errors.email}
                                </p>
                              </div>
                            )}
                            {emailVerificationPending && (
                              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                                <Mail className="w-4 h-4 text-yellow-600" />
                                <p className="text-sm text-yellow-700 font-medium">
                                  {t("ui.email_verification_pending")}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className="flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 cursor-pointer group"
                            onClick={() => handleEditField("email")}
                          >
                            <p className="text-gray-900 group-hover:text-blue-600">
                              {profile.email || t("ui.not_updated")}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditField("email");
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t("ui.phone_number")}
                        </label>
                        {editingField === "phoneNumber" ? (
                          <div>
                            <input
                              type="tel"
                              value={editForm.phoneNumber}
                              onChange={(e) =>
                                handleInputChange("phoneNumber", e.target.value)
                              }
                              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                                errors.phoneNumber
                                  ? "border-red-500 focus:ring-red-500"
                                  : "border-gray-300 focus:ring-blue-500"
                              }`}
                              placeholder={t("ui.enter_phone_number")}
                            />
                            {errors.phoneNumber && (
                              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <p className="text-sm text-red-700 font-medium">
                                  {errors.phoneNumber}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className="flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 cursor-pointer group"
                            onClick={() => handleEditField("phoneNumber")}
                          >
                            <p className="text-gray-900 group-hover:text-blue-600">
                              {profile.phoneNumber || t("ui.not_updated")}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditField("phoneNumber");
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {editingField && (
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={handleSaveProfile}
                          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-600 transition-all duration-200 group"
                        >
                          <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                          {t("ui.save")}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 group"
                        >
                          <X className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                          {t("ui.cancel")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSubmit={handleChangePasswordSubmit}
      />

      {/* Delete Avatar Modal */}
      <DeleteAvatarModal
        isOpen={showDeleteAvatarModal}
        onClose={() => setShowDeleteAvatarModal(false)}
        onConfirm={handleDeleteAvatar}
        loading={uploadingAvatar}
      />
    </div>
  );
};

export default Profile;