
import { useTranslation } from "react-i18next";
import TechnicianProfileUI from "../components/TechnicianProfileUI"; 
import { useTechnicianProfile } from "../hooks/useTechnicianProfile"; 

const TechnicianProfile = ({
  loggedInUser,
  onLogout,
  onShowLogin, // eslint-disable-line no-unused-vars
  onShowRegister,// eslint-disable-line no-unused-vars
  onProfileUpdate,
}) => {
  const { t } = useTranslation();
  const {
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
    showResendConfirmModal,
    isSavingRef,
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
    handleResendApplication,
    handleConfirmResend,       // <== THÊM: Hàm xử lý submit (API call)
    setShowResendConfirmModal,
  } = useTechnicianProfile({ onProfileUpdate, t });
  return (
    <TechnicianProfileUI
      t={t}
      // States
      profile={profile}
      loading={loading}
      error={error}
      showChangePasswordModal={showChangePasswordModal}
      editingField={editingField}
      editForm={editForm}
      emailVerificationPending={emailVerificationPending}
      activeTab={activeTab}
      errors={errors}
      avatarFile={avatarFile}
      avatarPreview={avatarPreview}
      uploadingAvatar={uploadingAvatar}
      showDeleteAvatarModal={showDeleteAvatarModal}
      showResendConfirmModal={showResendConfirmModal}
      isSavingRef={isSavingRef}
      // Handlers
      fetchProfile={fetchProfile}
      handleChangePassword={handleChangePassword}
      handleChangePasswordSubmit={handleChangePasswordSubmit}
      handleEditField={handleEditField}
      handleCancelEdit={handleCancelEdit}
      handleInputChange={handleInputChange}
      handleSaveProfile={handleSaveProfile}
      handleAvatarUpload={handleAvatarUpload}
      handleDeleteAvatar={handleDeleteAvatar}
      handleShowDeleteAvatarModal={handleShowDeleteAvatarModal}
      handleAvatarFileChange={handleAvatarFileChange}
      handleCancelAvatarUpload={handleCancelAvatarUpload}
      getAvatarUrl={getAvatarUrl}
      setShowChangePasswordModal={setShowChangePasswordModal}
      setShowDeleteAvatarModal={setShowDeleteAvatarModal}
      handleResendApplication={handleResendApplication}
      handleConfirmResend={handleConfirmResend}       // <== TRUYỀN PROP
      setShowResendConfirmModal={setShowResendConfirmModal}
      loggedInUser={loggedInUser}
      onLogout={onLogout}
    />
  );
};

export default TechnicianProfile;
