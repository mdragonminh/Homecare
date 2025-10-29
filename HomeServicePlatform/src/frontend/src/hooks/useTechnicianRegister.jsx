import { useState, useEffect, useCallback } from "react";
import { authApi } from "../services/authApi";
import { serviceApi } from "../services/serviceApi";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { X } from "lucide-react";

// Constants
export const majorCities = [
  { value: "HaNoi", name: "Hà Nội" },
  { value: "HCMCity", name: "TP. Hồ Chí Minh" },
  { value: "DaNang", name: "Đà Nẵng" },
  { value: "HaiPhong", name: "Hải Phòng" },
  { value: "CanTho", name: "Cần Thơ" },
];


export default function useTechnicianRegister(loggedInUser) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    experience: "",
    specializations: [],
    serviceCertificates: {},
    password: "",
    confirmPassword: "",
    avatarFile: null,
    agreeToTerms: false,
    agreeToBackgroundCheck: false,
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  useEffect(() => {
    if (loggedInUser) {
      navigate("/");
    }

    const fetchServices = async () => {
      setLoading(true);
      const res = await serviceApi.getServices();
      if (res.success) {
        setServices(res.data);
      } else {
        toast.error(
          res.message || t("technician_register.validation.error_fetching_services")
        );
      }
      setLoading(false);
    };
    fetchServices();
  }, [loggedInUser, navigate, t]);

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationErrors((prev) => ({ ...prev, [field]: null }));
  };

  const toggleSpecialization = (serviceId) => {
    const isCurrentlySelected = formData.specializations.includes(serviceId);
    if (isCurrentlySelected) {
      setValidationErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        if (newErrors.certificateUploadErrors?.[serviceId]) {
          const { [serviceId]: _, ...rest } = newErrors.certificateUploadErrors;
          newErrors.certificateUploadErrors = rest;
          if (Object.keys(newErrors.certificateUploadErrors).length === 0) {
            delete newErrors.certificateUploadErrors;
          }
        }
        if (newErrors.certificate) {
          newErrors.certificate = newErrors.certificate.filter((id) => id !== serviceId);
          if (newErrors.certificate.length === 0) {
            delete newErrors.certificate;
          }
        }
        return { ...newErrors, specializations: null };
      });
    } else {
      setValidationErrors((prev) => ({ ...prev, specializations: null }));
    }
    setFormData((prev) => {
      const newCerts = { ...prev.serviceCertificates };
      const isSelected = prev.specializations.includes(serviceId);

      if (isSelected) {
        delete newCerts[serviceId];
      }

      return {
        ...prev,
        specializations: isSelected
          ? prev.specializations.filter((s) => s !== serviceId)
          : [...prev.specializations, serviceId],
        serviceCertificates: newCerts,
      };
    });
  };

  const handleCertificateUpload = useCallback(
    async (file, serviceId) => {
      if (!file) return;
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        if (newErrors.certificate) {
          newErrors.certificate = newErrors.certificate.filter(
            (id) => id !== serviceId
          );
          if (newErrors.certificate.length === 0) {
            delete newErrors.certificate;
          }
        }
        // Đảm bảo lỗi upload cụ thể cũng được xóa
        if (newErrors.certificateUploadErrors?.[serviceId]) {
            const { [serviceId]: _, ...rest } = newErrors.certificateUploadErrors;
            newErrors.certificateUploadErrors = rest;
            if (Object.keys(newErrors.certificateUploadErrors).length === 0) {
              delete newErrors.certificateUploadErrors;
            }
        }
        return newErrors;
      });

      const maxFileSize = 5 * 1024 * 1024; 
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      const allowedExtensions = [".pdf", ".jpeg", ".png", ".jpg"];

      const fileNameLower = file.name.toLowerCase();
      const fileExtension = fileNameLower.substring(fileNameLower.lastIndexOf("."));

      const isAllowedType = allowedTypes.includes(file.type);
      const isAllowedExtension = allowedExtensions.includes(fileExtension);

      let error = null;

      if (file.size > maxFileSize) {
        error = `File ${file.name} ${t("technician_register.experience_skills.file_too_large")}`;
      }

      if (!isAllowedType || !isAllowedExtension) {
        error = `File ${file.name} ${t("technician_register.experience_skills.file_invalid_format")}`;
      }

      if (error) {
        setValidationErrors((prev) => ({
          ...prev,
          certificateUploadErrors: {
            ...(prev.certificateUploadErrors || {}),
            [serviceId]: error,
          },
        }));
        toast.error(error);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        serviceCertificates: {
          ...prev.serviceCertificates,
          [serviceId]: [
            ...(prev.serviceCertificates[serviceId] || []),
            { file, name: file.name },
          ],
        },
      }));

      toast.success(
        t("technician_register.experience_skills.file_uploaded", { fileName: file.name })
      );
    },
    [t]
  );

  const handleAvatarUpload = useCallback(
    async (file) => {
      if (!file) return;
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.avatarFile; // Xóa lỗi file bị thiếu
        delete newErrors.avatarUploadError;
        return newErrors;
      });

      const maxFileSize = 5 * 1024 * 1024; 
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      const allowedExtensions = [".jpeg", ".png", ".jpg"];

      const fileNameLower = file.name.toLowerCase();
      const fileExtension = fileNameLower.substring(fileNameLower.lastIndexOf("."));

      const isAllowedType = allowedTypes.includes(file.type);
      const isAllowedExtension = allowedExtensions.includes(fileExtension);

      let error = null;

      if (file.size > maxFileSize) {
        error = `File ${file.name} ${t("technician_register.personal_info.file_too_large")}`;
      }

      if (!isAllowedType || !isAllowedExtension) {
        error = `File ${t("technician_register.personal_info.file_invalid_format")}`;
      }

      if (error) {
        setValidationErrors((prev) => ({
          ...prev,
          avatarUploadError: error,
        }));
        toast.error(error);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        avatarFile: file,
      }));

      toast.success(
        t("technician_register.personal_info.avatar_uploaded", { fileName: file.name })
      );
    },
    [t]
  );

  const removeCertificate = (serviceId, fileName) => {
    setFormData((prev) => {
      const updatedCerts = {
        ...prev.serviceCertificates,
        [serviceId]: prev.serviceCertificates[serviceId].filter(
          (cert) => cert.name !== fileName
        ),
      };
      if (updatedCerts[serviceId].length === 0) {
        delete updatedCerts[serviceId];
      }
      return { ...prev, serviceCertificates: updatedCerts };
    });
    toast.info(t("technician_register.experience_skills.file_removed"));
  };

  const removeAvatar = () => {
    setFormData((prev) => ({
      ...prev,
      avatarFile: null,
    }));
    toast.info(t("technician_register.personal_info.avatar_removed"));
  };

  const viewCertificate = (certData) => {
    if (!certData.file) return;
    const fileURL = URL.createObjectURL(certData.file);
    setPreviewImage({ url: fileURL, name: certData.name });
  };

  const closePreview = () => {
    if (previewImage?.url) {
      URL.revokeObjectURL(previewImage.url);
    }
    setPreviewImage(null);
  };

  const validateForm = () => {
    const errors = {};
    const password = formData.password;
    const minLength = 8;
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!formData.fullName.trim()) {
      errors.fullName = t("technician_register.validation.full_name_required_error");
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t("technician_register.validation.email_invalid_error");
    }
    if (!formData.phone.trim() || !/^\d{10,11}$/.test(formData.phone)) {
      errors.phone = t("technician_register.validation.phone_invalid_error");
    }
    if (!formData.address) {
      errors.address = t("technician_register.validation.address_required_error");
    }
    if (!password) {
      errors.password = t("technician_register.validation.password_required_error");
    } else if (password.length < minLength) {
      errors.password = t("technician_register.validation.password_min_length_error", { minLength }); // Giả sử bạn có key này trong file dịch
    } else if (!strongPasswordRegex.test(password)) {
      errors.password = t("technician_register.validation.password_strength_error"); // Cần thêm key này vào file dịch
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t("technician_register.validation.confirm_password_mismatch_error");
    }
    if (!formData.experience) {
      errors.experience = t("technician_register.validation.experience_required_error");
    }
    if (formData.specializations.length === 0) {
      errors.specializations = t("technician_register.validation.specialization_required_error");
    }
    if (!formData.avatarFile) {
      errors.avatarFile = t("technician_register.validation.avatar_required_error");
    } else if (validationErrors.avatarUploadError) {
      errors.avatarFile = validationErrors.avatarUploadError;
    }

    const missingCertificates = formData.specializations.filter(
      (serviceId) =>
        !formData.serviceCertificates[serviceId] ||
        formData.serviceCertificates[serviceId].length === 0
    );
    if (missingCertificates.length > 0) {
      errors.certificate = missingCertificates;
    }

    if (!formData.agreeToTerms) {
      errors.agreeToTerms = t("technician_register.validation.agree_terms_required_error");
    }
    if (!formData.agreeToBackgroundCheck) {
      errors.agreeToBackgroundCheck = t("technician_register.validation.agree_background_check_required_error");
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    toast.dismiss();

    if (!validateForm()) {
      toast.error(t("technician_register.validation.fill_required_fields"));
      return;
    }

    if (validationErrors.certificate && validationErrors.certificate.length > 0) {
      const missingServices = validationErrors.certificate
        .map((id) => services.find((s) => s.id === id)?.name || `Service ${id}`)
        .join(", ");
      toast.error(
        `Vui lòng chọn ít nhất một chứng chỉ cho các dịch vụ: ${missingServices}`
      );
      return;
    }

    try {
      setSubmitting(true);

      const preparedData = authApi.prepareRegisterTechnicianData({
        email: formData.email,
        fullName: formData.fullName,
        phoneNumber: formData.phone,
        serviceIds: formData.specializations,
        experience: formData.experience,
        address: formData.address,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        avatarFile: formData.avatarFile,
        serviceCertificates: formData.serviceCertificates,
      });

      const registerRes = await authApi.registerTechnician(preparedData);

      if (!registerRes.success) {
        let errorMsg = registerRes.message;
        if (registerRes.errors) {
          errorMsg = Object.values(registerRes.errors).join(", ");
        } else if (typeof registerRes.message === "object") {
          errorMsg = JSON.stringify(registerRes.message);
        }
        toast.error(errorMsg || t("technician_register.validation.register_failed"));
        return;
      }

      toast.success(t("technician_register.validation.register_success"));
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      toast.error(
        err.message || "Có lỗi xảy ra khi đăng ký. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    formData,
    validationErrors,
    services,
    loading,
    submitting,
    previewImage,
    updateFormData,
    toggleSpecialization,
    handleCertificateUpload,
    removeCertificate,
    viewCertificate,
    closePreview,
    handleAvatarUpload, 
    removeAvatar, 
    handleSubmit,
    t,
  };
}