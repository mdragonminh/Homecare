
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
      loggedInUser={loggedInUser}
      onLogout={onLogout}
    />
  );
};

export default TechnicianProfile;
