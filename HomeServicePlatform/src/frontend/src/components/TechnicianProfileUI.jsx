// File: src/components/TechnicianProfileUI.jsx

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
import ChangePasswordModal from "./ChangePasswordModal";
import DeleteAvatarModal from "./DeleteAvatarModal";
import TechnicianDetails from "./TechnicianDetails";
import { Footer } from "./Footer";
import { renderApprovalStatus } from "../hooks/useTechnicianProfile";
const ApprovalStatusDisplay = ({ status }) => {
  const { text, classes } = renderApprovalStatus(status);
  return <span className={classes}>{text}</span>;
};
const LoadingContent = ({ t }) => (
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
const RejectionReasonCard = ({ profile, t }) => {
  if (profile?.approvalStatus !== 2 || !profile?.rejectionReason) return null;

  return (
    <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="bg-red-100 p-3 rounded-full">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-red-800 mb-3">
            Hồ sơ của bạn đã bị từ chối
          </h3>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-red-100">
            <p className="text-red-700 font-medium leading-relaxed whitespace-pre-wrap">
              {profile.rejectionReason}
            </p>
          </div>
          <p className="text-sm text-red-600 mt-4 font-medium italic">
            Vui lòng chỉnh sửa thông tin, tải lại chứng chỉ hợp lệ và gửi lại hồ
            sơ để được duyệt.
          </p>
        </div>
      </div>
    </div>
  );
};

const ErrorContent = ({ t, error, fetchProfile }) => (
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

const TechnicianProfileUI = ({
  t,
  // States
  profile,
  loading,
  error,
  showChangePasswordModal,
  editingField,
  editForm,
  emailVerificationPending,
  activeTab,
  errors,
  avatarFile,
  avatarPreview,
  uploadingAvatar,
  showDeleteAvatarModal,

  // Handlers
  fetchProfile,
  handleChangePassword,
  handleChangePasswordSubmit,
  handleEditField,
  handleCancelEdit,
  handleInputChange,
  handleSaveProfile,
  handleAvatarUpload,
  handleDeleteAvatar,
  handleShowDeleteAvatarModal,
  handleAvatarFileChange,
  handleCancelAvatarUpload,
  getAvatarUrl,
  setShowChangePasswordModal,
  setShowDeleteAvatarModal,
}) => {
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
        {loading && <LoadingContent t={t} />}
        {error && !loading && (
          <ErrorContent t={t} error={error} fetchProfile={fetchProfile} />
        )}

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
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : profile.fullName ? (
                        profile.fullName.charAt(0).toUpperCase()
                      ) : (
                        "U"
                      )}
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
                            disabled={uploadingAvatar}
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
              <RejectionReasonCard profile={profile} t={t} />
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
                    <div className="space-y-6 mt-6 pt-6 border-t border-gray-200 pb-4 mb-4">
                      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-gray-600" />
                        Trạng thái Hồ sơ
                      </h3>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          Trạng thái Duyệt
                        </label>
                        <ApprovalStatusDisplay
                          status={profile.approvalStatus}
                        />
                      </div>
                    </div>
                    {/* === THÔNG TIN TECHNICIAN === */}
                    <TechnicianDetails
                      profile={profile}
                      t={t}
                      getFileUrl={getAvatarUrl}
                    />

                    {/* Action Buttons */}
                    {editingField && (
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={handleSaveProfile}
                          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 group"
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

export default TechnicianProfileUI;
