import { useState, useEffect } from "react";
import { profileApi } from "../services/profileApi";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import ChangePasswordModal from "../components/ChangePasswordModal";
import EditProfileModal from "../components/EditProfileModal";
import { Key, Edit, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const Profile = ({ loggedInUser, onLogout, onShowLogin, onShowRegister }) => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

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

  const handleEditProfile = () => {
    setShowEditProfileModal(true);
  };

  const handleEditProfileSubmit = async (fullName, phoneNumber) => {
    const result = await profileApi.updateMyProfile(fullName, phoneNumber);
    if (result.success) {
      setProfile(result.data);
      toast.success(t("success.profile_updated"));
    } else {
      throw new Error(result.message);
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
      {/* Header */}
      <Header
        loggedInUser={loggedInUser}
        onLogout={onLogout}
        onShowLogin={onShowLogin}
        onShowRegister={onShowRegister}
      />

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t("ui.full_name")}
                          </label>
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                            <p className="text-gray-900">
                              {profile.fullName || t("ui.not_updated")}
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t("ui.email")}
                          </label>
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                            <p className="text-gray-900">
                              {profile.email || t("ui.not_updated")}
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t("ui.phone_number")}
                          </label>
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                            <p className="text-gray-900">
                              {profile.phoneNumber || t("ui.not_updated")}
                            </p>
                          </div>
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
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex flex-wrap gap-4">
                        <button
                          onClick={fetchProfile}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          {t("ui.refresh")}
                        </button>

                        <button
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          onClick={handleEditProfile}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          {t("ui.edit_info")}
                        </button>

                        <button
                          onClick={handleChangePassword}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <Key className="w-4 h-4 mr-2" />
                          {t("ui.change_password")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSubmit={handleChangePasswordSubmit}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        onSubmit={handleEditProfileSubmit}
        currentProfile={profile}
      />
    </div>
  );
};

export default Profile;
