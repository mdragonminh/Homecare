// File: src/hooks/useTechnicianProfile.js

import { useState, useEffect, useCallback,useRef } from "react";
import { toast } from "sonner";
import { profileApi, technicianApi as profileTechnicianApi, resendTechnicianApplication } from "../services/profileApi";
import { technicianApi as technicianApiService } from "../services/profileApi";
import { jwtDecode } from "jwt-decode";
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
export const renderApprovalStatus = (status) => {
  let text = "Không xác định";
  let classes = "bg-gray-100 text-gray-800 border-gray-300";

  switch (status) {
    case 0:
      text = "Đang Chờ Duyệt";
      classes = "bg-yellow-100 text-yellow-800 border-yellow-300";
      break;
    case 1:
      text = "Đã Duyệt";
      classes = "bg-green-100 text-green-800 border-green-300";
      break;
    case 2:
      text = "Đã Từ Chối";
      classes = "bg-red-100 text-red-800 border-red-300";
      break;
    default:
      break;
  }
  return {
    text,
    classes: `inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border ${classes}`,
  };
};

// ------------------------------------------
// 2. MAIN LOGIC HOOK
// ------------------------------------------

export const useTechnicianProfile = ({ onProfileUpdate, t }) => {
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
const [showResendConfirmModal, setShowResendConfirmModal] = useState(false);
const [isTogglingStatus, setIsTogglingStatus] = useState(false);
const isSavingRef = useRef(false);
  // ------------------------------------------
  // 3. VALIDATION FUNCTIONS
  // ------------------------------------------

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

  const validateEmail = useCallback(
    (value) => {
      if (!value || value.trim() === "") {
        return t("ui.validation.email.required");
      }
      if (/\s/.test(value)) {
        return t("ui.validation.email.no_spaces");
      }
      const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;

      if (!emailRegex.test(value)) {
        return t("ui.validation.email.invalid_format");
      }

      if ((value.match(/@/g) || []).length !== 1) {
        return t("ui.validation.email.single_at_required");
      }

      const domainParts = value.split("@")[1];
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

  const validatePhoneNumber = useCallback(
    (value) => {
      if (!value || value.trim() === "") {
        return t("ui.validation.phone.required");
      }
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

  // ------------------------------------------
  // 4. API & DATA FETCHING
  // ------------------------------------------

  const fetchProfile = useCallback(async (skipIfSaving = false) => {
  if (skipIfSaving && isSavingRef.current) {
    return; // Skip nếu đang trong quá trình save
  }
  
  setLoading(true);
  setError("");

  const technicianIdFromStorage = localStorage.getItem("userId");
  const jwtToken = localStorage.getItem("jwtToken");

  if (!technicianIdFromStorage || !jwtToken) {
    setError(
      t("ui.login_required") ||
        "Không tìm thấy token. Vui lòng đăng nhập lại."
    );
    setLoading(false);
    return;
  }

  try {
    const decodedToken = jwtDecode(jwtToken);
    const ROLE_CLAIM_NAME =
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
    const ID_CLAIM_NAME =
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";

    const roleFromToken = decodedToken[ROLE_CLAIM_NAME]
      ? String(decodedToken[ROLE_CLAIM_NAME]).toLowerCase()
      : "N/A";
    const userIdFromToken = decodedToken[ID_CLAIM_NAME];

    if (roleFromToken !== "technician") {
      //
    }

    if (technicianIdFromStorage !== userIdFromToken) {
      //
    }

    const result = await profileTechnicianApi.getTechnicianDetails(
      technicianIdFromStorage
    );

    if (result.success) {
      const rawData = result.data;
      const data = {
        ...rawData,
        certificateFiles:
          rawData.CertificateFiles || rawData.certificateFiles || [],
        legalDocument:
          rawData.LegalDocuments ||
          rawData.legalDocument ||
          rawData.LegalDocument ||
          [],
      };
      if (Array.isArray(data.avatar) && data.avatar.length > 0) {
        data.avatarUrl = data.avatar[0].filePath;
      } else {
        data.avatarUrl = null;
      }
      setProfile(data);
    } else {
      setError(result.message);
    }
  } catch (err) {
    setError(
      t("ui.error_loading_profile") + (err.message ? `: ${err.message}` : "")
    );
  } finally {
    setLoading(false);
  }
}, [t]);
  
const handleResendApplication = useCallback(() => {
    // Mở modal xác nhận
    setShowResendConfirmModal(true);
}, []);

const handleConfirmResend = useCallback(async () => {
    toast.loading(t("ui.resending_application") || "Đang gửi lại hồ sơ...", { id: "resend-app" });
    setUploadingAvatar(true); // Dùng lại state này cho loading indicator

    try {
        const result = await resendTechnicianApplication(); //

        toast.dismiss("resend-app");

        if (result.success) {
            toast.success("Hồ sơ đã được gửi lại thành công! Vui lòng đợi phê duyệt.");
            fetchProfile(); //
            setShowResendConfirmModal(false); // Đóng modal sau khi thành công
        } else {
            toast.error(result.message || "Gửi lại hồ sơ thất bại.");
        }
    } catch (error) {
        toast.dismiss("resend-app");
        toast.error(error.message || "Gửi lại hồ sơ thất bại.");
    } finally {
        setUploadingAvatar(false);
    }
}, [fetchProfile, t]);
  // ------------------------------------------
  // 5. EFFECT HOOKS
  // ------------------------------------------

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
  }, [fetchProfile]);

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

  useEffect(() => {
    if (editingField && editForm) {
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

  // ------------------------------------------
  // 6. HANDLERS
  // ------------------------------------------

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
    const fullNameError = validateFullName(editForm.fullName);
    const emailError = validateEmail(editForm.email);
    const phoneError = validatePhoneNumber(editForm.phoneNumber);

    setErrors({
      fullName: fullNameError,
      email: emailError,
      phoneNumber: phoneError,
    });

    if (fullNameError || emailError || phoneError) {
      return false; // Trả về false nếu có lỗi
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

      // CẬP NHẬT LOCAL STATE thay vì fetch lại
      const updatedProfileData = {
        ...profile,
        fullName: editForm.fullName,
        phoneNumber: editForm.phoneNumber,
      };

      setProfile(updatedProfileData);

      if (onProfileUpdate) {
        onProfileUpdate(updatedProfileData);
      }

      setEditingField(null);
      return true; // Thành công
    } else if (fieldToUpdate === "email") {
      if (editForm.email !== profile.email) {
        const emailResult = await profileApi.requestEmailChange(
          editForm.email
        );
        if (emailResult.success) {
          setEmailVerificationPending(true);
          toast.success(t("success.profile_updated_email_pending"));
          return true;
        } else {
          throw new Error(emailResult.message);
        }
      } else {
        setEditingField(null);
        return true;
      }
    }
    return true;
  } catch (error) {
    toast.error(error.message);
    return false;
  }
};
  const handleAvatarUpload = useCallback(async () => {
    if (!avatarFile || !profile?.id) {
      toast.error("Vui lòng chọn tệp ảnh để tải lên.");
      return;
    }
    const objectTypeName = "Technician";

    setUploadingAvatar(true);
    try {
      const result = await technicianApiService.uploadAvatar(
        avatarFile,
        objectTypeName
      );

      if (result.success) {
        toast.success("Tải ảnh đại diện lên thành công!");
        await fetchProfile(profile.id);
        setAvatarFile(null);
        setAvatarPreview(null);
      } else {
        toast.error(result.message || "Tải ảnh đại diện lên thất bại.");
      }
    } catch (error) {
      toast.error("Tải ảnh đại diện lên thất bại.");
      console.error("Avatar upload error:", error);
    } finally {
      setUploadingAvatar(false);
    }
  }, [avatarFile, profile, fetchProfile]);
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

  const handleShowDeleteAvatarModal = () => {
    setShowDeleteAvatarModal(true);
  };

  const handleAvatarFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        toast.error(t("ui.avatar_invalid_format"));
        event.target.value = "";
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error(t("ui.avatar_too_large"));
        event.target.value = "";
        return;
      }

      setAvatarFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelAvatarUpload = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const getAvatarUrl = useCallback((avatarUrl) => {
    if (!avatarUrl) return null;
    const cacheBuster = `t=${new Date().getTime()}`;
    if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
      const separator = avatarUrl.includes("?") ? "&" : "?";
      return `${avatarUrl}${separator}${cacheBuster}`;
    }

    const API_URL = import.meta.env.VITE_API_URL;
    const baseUrl = API_URL.endsWith("/api")
      ? API_URL
      : API_URL.replace(/\/api$/, "") + "/api";
    const baseFileUrl = `${baseUrl}/File/preview?filePath=${encodeURIComponent(
      avatarUrl
    )}`;
    return `${baseFileUrl}&${cacheBuster}`;
  }, []);

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
  };

  const handleToggleActiveStatus = useCallback(async () => {
    if (!profile || isTogglingStatus) return;

    // Mặc định là true nếu chưa có giá trị
    const currentStatus = profile.isActive !== false;
    const newStatus = !currentStatus;
    setIsTogglingStatus(true);
    
    toast.loading(
      newStatus 
        ? t("ui.activating_account") || "Đang kích hoạt tài khoản..."
        : t("ui.deactivating_account") || "Đang vô hiệu hóa tài khoản...",
      { id: "toggle-status" }
    );

    try {
      const result = await technicianApiService.updateActiveStatus(newStatus);
      toast.dismiss("toggle-status");

      if (result.success) {
        toast.success(
          newStatus
            ? "Tài khoản đã chuyển sang trạng thái làm việc."
            : "Tài khoản đã chuyển sang trạng thái ngừng làm việc."
        );
        // Cập nhật profile local state
        setProfile((prev) => ({
          ...prev,
          isActive: newStatus,
        }));
        // Fetch lại để đảm bảo đồng bộ
        await fetchProfile();
      } else {
        toast.error(result.message || "Cập nhật trạng thái thất bại.");
      }
    } catch (error) {
      toast.dismiss("toggle-status");
      toast.error(error.message || "Có lỗi xảy ra khi cập nhật trạng thái.");
      console.error("Toggle active status error:", error);
    } finally {
      setIsTogglingStatus(false);
    }
  }, [profile, isTogglingStatus, t, fetchProfile]);

  return {
    // State
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
    // Handlers & Functions
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
    setActiveTab,
    formatDate,
    handleResendApplication, // Giờ là hàm mở modal
    handleConfirmResend, // Hàm xử lý submit API
    setShowResendConfirmModal,
    handleToggleActiveStatus,
    isTogglingStatus,
  };
};
