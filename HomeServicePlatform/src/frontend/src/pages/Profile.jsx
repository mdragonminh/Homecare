import {
  Edit,
  Home,
  Key,
  MapPin,
  RefreshCw,
  Save,
  X,
  Check,
  Mail,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ChangePasswordModal from "../components/ChangePasswordModal";
import { Footer } from "../components/Footer";
import { profileApi } from "../services/profileApi";

const Profile = ({ loggedInUser, onLogout, onShowLogin, onShowRegister }) => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [editingField, setEditingField] = useState(null); // null, 'fullName', 'email', 'phoneNumber'
  const [editForm, setEditForm] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
  });
  const [emailVerificationPending, setEmailVerificationPending] =
    useState(false);

  useEffect(() => {
    fetchProfile();

    // Xử lý URL parameters từ email confirmation
    const urlParams = new URLSearchParams(window.location.search);
    const emailChanged = urlParams.get("emailChanged");
    const message = urlParams.get("message");

    if (emailChanged !== null && message) {
      if (emailChanged === "true") {
        toast.success(decodeURIComponent(message));
        setEmailVerificationPending(false);
        // Refresh profile để lấy email mới
        setTimeout(() => {
          fetchProfile();
        }, 1000);
      } else {
        toast.error(decodeURIComponent(message));
      }

      // Xóa parameters khỏi URL
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
    }
  }, [profile, editingField]);

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
    // Reset form về giá trị ban đầu
    setEditForm({
      fullName: profile.fullName || "",
      phoneNumber: profile.phoneNumber || "",
      email: profile.email || "",
    });
  };

  const handleInputChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      const fieldToUpdate = editingField;

      if (fieldToUpdate === "fullName" || fieldToUpdate === "phoneNumber") {
        // Cập nhật fullName và/hoặc phoneNumber
        const updateResult = await profileApi.updateMyProfile(
          editForm.fullName,
          editForm.phoneNumber
        );

        if (!updateResult.success) {
          throw new Error(updateResult.message);
        }

        // Cập nhật profile với thông tin mới
        setProfile((prev) => ({
          ...prev,
          fullName: editForm.fullName,
          phoneNumber: editForm.phoneNumber,
        }));

        setEditingField(null);
        toast.success(t("success.profile_updated"));
      } else if (fieldToUpdate === "email") {
        // Kiểm tra nếu email thay đổi
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

  const LoadingContent = () => (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{t("ui.loading_profile")}</p>
      </div>
    </div>
  );

  const ErrorContent = () => (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-md">
          <p className="font-bold">{t("ui.error_occurred")}</p>
          <p>{error}</p>
        </div>
        <button
          onClick={fetchProfile}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {t("ui.try_again")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading && <LoadingContent />}
          {error && !loading && <ErrorContent />}

          {!loading && !error && (
            <>
              {/* Header */}
              <div className="bg-white rounded-lg shadow-sm mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {t("ui.personal_information")}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {t("ui.view_manage_profile")}
                  </p>
                </div>
              </div>

              {/* Profile Info */}
              {profile && (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="px-6 py-6">
                    {/* Avatar Section */}
                    <div className="flex items-center mb-8">
                      <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {profile.fullName
                          ? profile.fullName.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                      <div className="ml-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                          {profile.fullName}
                        </h2>
                        <p className="text-gray-600">{profile.email}</p>
                        <div className="flex items-center mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {t("ui.account_verified")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Profile Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              {t("ui.full_name")}
                            </label>
                            {editingField !== "fullName" && (
                              <button
                                onClick={() => handleEditField("fullName")}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                {t("ui.edit")}
                              </button>
                            )}
                          </div>
                          {editingField === "fullName" ? (
                            <input
                              type="text"
                              value={editForm.fullName}
                              onChange={(e) =>
                                handleInputChange("fullName", e.target.value)
                              }
                              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={t("ui.enter_full_name")}
                            />
                          ) : (
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                              <p className="text-gray-900">
                                {profile.fullName || t("ui.not_updated")}
                              </p>
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              {t("ui.email")}
                            </label>
                            {editingField !== "email" && (
                              <button
                                onClick={() => handleEditField("email")}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                {t("ui.edit")}
                              </button>
                            )}
                          </div>
                          {editingField === "email" ? (
                            <div>
                              <input
                                type="email"
                                value={editForm.email}
                                onChange={(e) =>
                                  handleInputChange("email", e.target.value)
                                }
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={t("ui.enter_email")}
                              />
                              {emailVerificationPending && (
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                  <div className="flex items-center">
                                    <Mail className="w-4 h-4 mr-2 text-yellow-600" />
                                    <p className="text-sm text-yellow-700">
                                      {t("ui.email_verification_pending")}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                              <p className="text-gray-900">
                                {profile.email || t("ui.not_updated")}
                              </p>
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              {t("ui.phone_number")}
                            </label>
                            {editingField !== "phoneNumber" && (
                              <button
                                onClick={() => handleEditField("phoneNumber")}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                {t("ui.edit")}
                              </button>
                            )}
                          </div>
                          {editingField === "phoneNumber" ? (
                            <input
                              type="tel"
                              value={editForm.phoneNumber}
                              onChange={(e) =>
                                handleInputChange("phoneNumber", e.target.value)
                              }
                              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={t("ui.enter_phone_number")}
                            />
                          ) : (
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                              <p className="text-gray-900">
                                {profile.phoneNumber || t("ui.not_updated")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* Timestamps */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {t("ui.system_information")}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t("ui.account_created")}
                              </label>
                              <p className="text-sm text-gray-600">
                                {formatDate(profile.dateCreated)}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t("ui.total_homes")}
                              </label>
                              <div className="flex items-center">
                                <Home className="w-4 h-4 mr-2 text-gray-500" />
                                <p className="text-sm text-gray-600">
                                  {profile.totalHomes || 0} {t("ui.homes")}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex flex-wrap gap-4">
                        {editingField ? (
                          <>
                            <button
                              onClick={handleSaveProfile}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              {t("ui.save")}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <X className="w-4 h-4 mr-2" />
                              {t("ui.cancel")}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                (window.location.href = "/list-home")
                              }
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <MapPin className="w-4 h-4 mr-2" />
                              {t("ui.manage_addresses")}
                            </button>

                            <button
                              onClick={handleChangePassword}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <Key className="w-4 h-4 mr-2" />
                              {t("ui.change_password")}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSubmit={handleChangePasswordSubmit}
      />
    </div>
  );
};

export default Profile;
