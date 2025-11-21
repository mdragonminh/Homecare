import { useState, useEffect, useCallback } from "react";
import { authApi } from "../services/authApi";
import { serviceApi } from "../services/serviceApi";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { X } from "lucide-react";
import { ocrApi } from "../services/ocrApi";
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
  const [loadingOcr, setLoadingOcr] = useState(false);
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
    citizenId: "",
    citizenIdFile: null,
    legalDocumentFile: null,
    agreeToTerms: false,
    agreeToBackgroundCheck: false,
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [servicesLoading, setServicesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewCitizenId, setPreviewCitizenId] = useState(null);
  const [previewLegalDocument, setPreviewLegalDocument] = useState(null);
  useEffect(() => {
    if (loggedInUser) {
      navigate("/");
    }

    const fetchServices = async () => {
      setServicesLoading(true);
      const res = await serviceApi.getServices();
      if (res.success) {
        setServices(res.data);
      } else {
        toast.error(
          res.message ||
            t("technician_register.validation.error_fetching_services")
        );
      }
      setServicesLoading(false);
    };
    fetchServices();
    return () => {
      if (previewCitizenId) {
        URL.revokeObjectURL(previewCitizenId);
      }
      if (previewLegalDocument) {
        URL.revokeObjectURL(previewLegalDocument);
      }
    };
  }, [loggedInUser, navigate, t, previewCitizenId, previewLegalDocument]);

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
          newErrors.certificate = newErrors.certificate.filter(
            (id) => id !== serviceId
          );
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
  const handleLegalDocumentUpload = useCallback(
    async (file) => {
      if (!file) return;
      toast.dismiss();

      if (previewLegalDocument) {
        URL.revokeObjectURL(previewLegalDocument);
      }
      setPreviewLegalDocument(null);

      const maxFileSize = 5 * 1024 * 1024;
      // Cho phép PDF, ảnh
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/jfif",
      ];
      const allowedExtensions = [".pdf", ".jpeg", ".png", ".jpg", ".jfif"];
      const fileNameLower = file.name.toLowerCase();
      const fileExtension = fileNameLower.substring(
        fileNameLower.lastIndexOf(".")
      );

      const isAllowedType = allowedTypes.includes(file.type);
      const isAllowedExtension = allowedExtensions.includes(fileExtension);

      let error = null;

      if (file.size > maxFileSize) {
        error =
          t("technician_register.legal_document.file_too_large") ||
          `Tập tin ${file.name} quá lớn (tối đa 5MB).`;
      } else if (!isAllowedType || !isAllowedExtension) {
        error =
          t("technician_register.legal_document.file_invalid_format") ||
          `Tập tin ${file.name} không đúng định dạng (chỉ cho phép JPG, PNG, PDF).`;
      }

      if (error) {
        setFormData((prev) => ({
          ...prev,
          legalDocumentFile: null,
        }));
        setValidationErrors((prev) => ({
          ...prev,
          legalDocumentFile: error,
        }));
        toast.error(error);
        return;
      }

      // Thành công
      const fileUrl = URL.createObjectURL(file);
      setPreviewLegalDocument(fileUrl);
      setFormData((prev) => ({
        ...prev,
        legalDocumentFile: file,
      }));
      setValidationErrors((prev) => ({
        ...prev,
        legalDocumentFile: null,
      }));
      toast.success(
        t("technician_register.legal_document.file_uploaded", {
          fileName: file.name,
        }) || `Đã tải lên tệp ${file.name}.`
      );
    },
    [t, previewLegalDocument]
  );
  const removeLegalDocumentFile = useCallback(() => {
    if (previewLegalDocument) {
      URL.revokeObjectURL(previewLegalDocument);
    }
    setPreviewLegalDocument(null);
    setFormData((prev) => ({
      ...prev,
      legalDocumentFile: null,
    }));
    setValidationErrors((prev) => ({
      ...prev,
      legalDocumentFile: undefined,
    }));
    toast.info(
      t("technician_register.legal_document.file_removed") ||
        "Đã xóa tệp Sơ yếu lí lịch."
    );
  }, [t, previewLegalDocument]);
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
        if (newErrors.certificateUploadErrors?.[serviceId]) {
          const { [serviceId]: _, ...rest } = newErrors.certificateUploadErrors;
          newErrors.certificateUploadErrors = rest;
          if (Object.keys(newErrors.certificateUploadErrors).length === 0) {
            delete newErrors.certificateUploadErrors;
          }
        }
        if (newErrors.certificateBeErrors?.[serviceId]) {
          const { [serviceId]: _, ...rest } = newErrors.certificateBeErrors;
          newErrors.certificateBeErrors = rest;
          if (Object.keys(newErrors.certificateBeErrors).length === 0) {
            delete newErrors.certificateBeErrors;
          }
        }
        return newErrors;
      });

      const maxFileSize = 5 * 1024 * 1024;
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ];
      const allowedExtensions = [".pdf", ".jpeg", ".png", ".jpg"];

      const fileNameLower = file.name.toLowerCase();
      const fileExtension = fileNameLower.substring(
        fileNameLower.lastIndexOf(".")
      );

      const isAllowedType = allowedTypes.includes(file.type);
      const isAllowedExtension = allowedExtensions.includes(fileExtension);

      let error = null;

      if (file.size > maxFileSize) {
        error = `File ${file.name} ${t(
          "technician_register.experience_skills.file_too_large"
        )}`;
      }

      if (!isAllowedType || !isAllowedExtension) {
        error = `File ${file.name} ${t(
          "technician_register.experience_skills.file_invalid_format"
        )}`;
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
        t("technician_register.experience_skills.file_uploaded", {
          fileName: file.name,
        })
      );
    },
    [t]
  );
  const handleCitizenIdUpload = useCallback(
    async (file) => {
      if (!file) return;
      toast.dismiss();
      if (previewCitizenId) {
        URL.revokeObjectURL(previewCitizenId);
      }
      setPreviewCitizenId(null);
      const maxFileSize = 5 * 1024 * 1024;
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/jfif",
      ];
      const allowedExtensions = [".jpeg", ".png", ".jpg", ".jfif"];
      const fileNameLower = file.name.toLowerCase();
      const fileExtension = fileNameLower.substring(
        fileNameLower.lastIndexOf(".")
      );

      const isAllowedType = allowedTypes.includes(file.type);
      const isAllowedExtension = allowedExtensions.includes(fileExtension);

      let error = null;

      if (file.size > maxFileSize) {
        error =
          t("technician_register.citizen_id.file_too_large") ||
          `File ${file.name} quá lớn (tối đa 5MB).`;
      } else if (!isAllowedType || !isAllowedExtension) {
        error =
          t("technician_register.citizen_id.file_invalid_format") ||
          `File ${file.name} không đúng định dạng (chỉ cho phép JPG, PNG, PDF).`;
      }
      if (error) {
        setFormData((prev) => ({
          ...prev,
          citizenIdFile: null,
        }));
        setValidationErrors((prev) => ({
          ...prev,
          citizenIdFile: error,
          citizenId: undefined,
        }));
        toast.error(error);
        return;
      }
      setPreviewCitizenId(URL.createObjectURL(file));

      setFormData((prev) => ({
        ...prev,
        citizenIdFile: file,
      }));
      setValidationErrors((prev) => ({
        ...prev,
        citizenId: undefined,
        citizenIdFile: undefined,
      }));

      setLoadingOcr(true);

      try {
        const result = await ocrApi.scanCitizenId(file);
        if (result.success && result.data && result.data.idNumber) {
          setFormData((prev) => ({
            ...prev,
            citizenId: result.data.idNumber,
            fullName: result.data.fullName,
          }));
          toast.success(t("technician_register.ocr.success_filled"));
        } else {
          const specificError =
            t("technician_register.ocr.failed_no_id") ||
            "Không trích xuất được Số CCCD. Vui lòng thử lại ảnh khác hoặc nhập thủ công.";

          setValidationErrors((prev) => ({
            ...prev,
            citizenId: specificError,
          }));

          toast.error(result.message || specificError);
        }
      } catch (err) {
        console.error("OCR Error:", err);
        setValidationErrors((prev) => ({
          ...prev,
          citizenId:
            t("technician_register.ocr.error_general") ||
            "Lỗi kết nối hoặc xử lý. Vui lòng thử lại.",
        }));
        toast.error(t("technician_register.ocr.error_general"));
      } finally {
        setLoadingOcr(false);
      }
    },
    [t, previewCitizenId]
  );

  const removeCitizenIdFile = useCallback(() => {
    if (previewCitizenId) {
      URL.revokeObjectURL(previewCitizenId);
    }
    setPreviewCitizenId(null);
    setFormData((prev) => ({
      ...prev,
      citizenIdFile: null,
      citizenId: "",
    }));
    setValidationErrors((prev) => ({
      ...prev,
      citizenId: undefined,
      citizenIdFile: undefined,
    }));
    toast.info(
      t("technician_register.citizen_id.file_removed") || "Đã xóa ảnh CCCD."
    );
  }, [t, previewCitizenId]);

  const handleAvatarUpload = useCallback(
    async (file) => {
      if (!file) return;
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.avatarFile;
        delete newErrors.avatarUploadError;
        return newErrors;
      });

      const maxFileSize = 5 * 1024 * 1024;
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      const allowedExtensions = [".jpeg", ".png", ".jpg"];

      const fileNameLower = file.name.toLowerCase();
      const fileExtension = fileNameLower.substring(
        fileNameLower.lastIndexOf(".")
      );

      const isAllowedType = allowedTypes.includes(file.type);
      const isAllowedExtension = allowedExtensions.includes(fileExtension);

      let error = null;

      if (file.size > maxFileSize) {
        error = `File ${file.name} ${t(
          "technician_register.personal_info.file_too_large"
        )}`;
      }

      if (!isAllowedType || !isAllowedExtension) {
        error = `File ${t(
          "technician_register.personal_info.file_invalid_format"
        )}`;
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
        t("technician_register.personal_info.avatar_uploaded", {
          fileName: file.name,
        })
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
    const citizenIdRegex = /^\d{12}$/;
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!formData.fullName.trim()) {
      errors.fullName = t(
        "technician_register.validation.full_name_required_error"
      );
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t("technician_register.validation.email_invalid_error");
    }
    const phone = formData.phone.trim();
    const phoneLength = phone.length;
    if (!phone) {
      errors.phone = t("technician_register.validation.phone_required_error");
    } 
    else if (!/^\d+$/.test(phone)) {
      errors.phone = t("technician_register.validation.phone_must_be_digits");
    } 
    else if (phoneLength !== 10 && phoneLength !== 11) {
      errors.phone = t("technician_register.validation.phone_length_error");
    }
    if (!formData.address) {
      errors.address = t(
        "technician_register.validation.address_required_error"
      );
    }
    if (!formData.legalDocumentFile) {
      errors.legalDocumentFile = t(
        "technician_register.validation.legal_document_required"
      );
    }
    if (!password) {
      errors.password = t(
        "technician_register.validation.password_required_error"
      );
    } else if (password.length < minLength) {
      errors.password = t(
        "technician_register.validation.password_min_length_error",
        { minLength }
      );
    } else if (!strongPasswordRegex.test(password)) {
      errors.password = t(
        "technician_register.validation.password_strength_error"
      );
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t(
        "technician_register.validation.confirm_password_mismatch_error"
      );
    }
    if (!formData.experience) {
      errors.experience = t(
        "technician_register.validation.experience_required_error"
      );
    }
    if (!formData.avatarFile) {
      errors.avatarFile = t(
        "technician_register.validation.avatar_required_error"
      );
    } else if (validationErrors.avatarUploadError) {
      errors.avatarFile = validationErrors.avatarUploadError;
    }
    if (!formData.citizenId.trim()) {
      errors.citizenId = t(
        "technician_register.validation.citizen_id_required"
      );
    } else if (!citizenIdRegex.test(formData.citizenId.trim())) {
      errors.citizenId = t("technician_register.validation.citizen_id_invalid");
    }
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = t(
        "technician_register.validation.agree_terms_required_error"
      );
    }
    if (!formData.agreeToBackgroundCheck) {
      errors.agreeToBackgroundCheck = t(
        "technician_register.validation.agree_background_check_required_error"
      );
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
        citizenId: formData.citizenId,
        serviceCertificates: formData.serviceCertificates,
        legalDocumentFile: formData.legalDocumentFile,
      });

      const registerRes = await authApi.registerTechnician(preparedData);

      if (!registerRes.success) {
        let errorMsg = registerRes.message;
        const newErrors = {};
        newErrors.certificateBeErrors = {};
        if (registerRes.errors) {
          const beErrors = registerRes.errors;

          if (beErrors.CitizenId) {
            newErrors.citizenId = beErrors.CitizenId[0];
          }

          if (beErrors.LegalDocument) {
            newErrors.legalDocumentFile = beErrors.LegalDocument[0];
          }
          if (Object.keys(beErrors).length > 0) {
            errorMsg =
              newErrors.citizenId ||
              newErrors.legalDocumentFile ||
              Object.values(beErrors).flat().join(", ") ||
              errorMsg;
          }
        }
        if (errorMsg) {
          const lowerCaseMessage = errorMsg.toLowerCase();
          if (
            lowerCaseMessage.includes("tài liệu pháp lý không hợp lệ") ||
            lowerCaseMessage.includes("tài liệu pháp lý không phải của bạn")
          ) {
            newErrors.legalDocumentFile = errorMsg;
          }
          if (
            lowerCaseMessage.includes("chứng chỉ không phù hợp với dịch vụ")
          ) {
            const parts = errorMsg.split(":");
            if (parts.length > 1) {
              const serviceName = parts[1].trim();
              const service = services.find((s) => s.name === serviceName);

              if (service) {
                newErrors.certificateBeErrors[service.id] = errorMsg;
              }
            }
          }
          if (
            lowerCaseMessage.includes("số cccd không hợp lệ") ||
            lowerCaseMessage.includes("số cccd không khớp")
          ) {
            newErrors.citizenId = errorMsg;
          }
        }
        const errorsToUpdate = {};
        for (const key in newErrors) {
          if (
            (newErrors[key] &&
              Array.isArray(newErrors[key]) &&
              newErrors[key].length > 0) ||
            Object.keys(newErrors[key]).length > 0 ||
            typeof newErrors[key] === "string"
          ) {
            errorsToUpdate[key] = newErrors[key];
          }
        }

        if (Object.keys(errorsToUpdate).length > 0) {
          setValidationErrors((prev) => ({ ...prev, ...errorsToUpdate }));
        }

        // Fallback cho lỗi không xác định
        if (typeof registerRes.message === "object") {
          errorMsg = JSON.stringify(registerRes.message);
        }

        toast.error(
          errorMsg || t("technician_register.validation.register_failed")
        );
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
    servicesLoading,
    loadingOcr,
    submitting,
    previewImage,
    previewCitizenId,
    previewLegalDocument,
    updateFormData,
    toggleSpecialization,
    handleCertificateUpload,
    removeCertificate,
    viewCertificate,
    closePreview,
    handleCitizenIdUpload,
    handleAvatarUpload,
    handleLegalDocumentUpload,
    removeLegalDocumentFile,
    removeAvatar,
    removeCitizenIdFile,
    handleSubmit,
    t,
  };
}
