import { useState, useEffect, useCallback } from "react";
import {
  Upload,
  User,
  Briefcase,
  FileText,
  Award,
  Phone,
  Mail,
  MapPin,
  Star,
  Shield,
  Zap,
  Eye,
  Trash2,
  X,
  Loader2, // Added for loading spinner
} from "lucide-react";
import { authApi } from "../../services/authApi";
import { serviceApi } from "../../services/serviceApi";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const majorCities = [
  { value: "HaNoi", name: "Hà Nội" },
  { value: "HCMCity", name: "TP. Hồ Chí Minh" },
  { value: "DaNang", name: "Đà Nẵng" },
  { value: "HaiPhong", name: "Hải Phòng" },
  { value: "CanTho", name: "Cần Thơ" },
];

export default function TechnicianRegister({ loggedInUser }) {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    experience: "",
    specializations: [],
    serviceCertificates: {},
    bio: "",
    agreeToTerms: false,
    agreeToBackgroundCheck: false,
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();

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
    setValidationErrors((prev) => ({ ...prev, specializations: null }));
    const isSelected = formData.specializations.includes(serviceId);
    setFormData((prev) => {
      const newCerts = { ...prev.serviceCertificates };
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
          newErrors.certificate = newErrors.certificate.filter((id) => id !== serviceId);
          if (newErrors.certificate.length === 0) {
            delete newErrors.certificate;
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
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (file.size > maxFileSize) {
        toast.error(
          `File ${file.name} ${t("technician_register.experience_skills.file_too_large")}`
        );
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          `File ${file.name} ${t("technician_register.experience_skills.file_invalid_format")}`
        );
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

    if (!formData.experience) {
      errors.experience = t("technician_register.validation.experience_required_error");
    }
    if (formData.specializations.length === 0) {
      errors.specializations = t(
        "technician_register.validation.specialization_required_error"
      );
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
      errors.agreeToBackgroundCheck = t(
        "technician_register.validation.agree_background_check_required_error"
      );
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    // Clear all previous toasts to prevent overlap
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

    let technicianId = null;

    try {
      setSubmitting(true);

      const preparedData = authApi.prepareRegisterTechnicianData({
        email: formData.email,
        fullName: formData.fullName,
        phoneNumber: formData.phone,
        serviceIds: formData.specializations,
        experience: formData.experience,
        address: formData.address,
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

      technicianId = registerRes.data?.technicianId || registerRes.data?.id;

      if (!technicianId) {
        toast.error("Không nhận được technicianId từ server.");
        return;
      }

      // Removed intermediate toast for uploading certificates
      // toast.info("Đang upload chứng chỉ...");

      const uploadPromises = formData.specializations.map(async (serviceId) => {
        const certs = formData.serviceCertificates[serviceId] || [];
        if (certs.length === 0) return [];

        const files = certs.map((cert) => cert.file);

        const uploadRes = await authApi.uploadFiles(files, technicianId, "Technician");

        if (!uploadRes.success) {
          throw new Error(
            `Upload thất bại cho dịch vụ ${serviceId}: ${uploadRes.message}`
          );
        }

        const filePaths = uploadRes.data?.filePaths || [];
        return filePaths;
      });

      const allFilePaths = (await Promise.all(uploadPromises)).flat();

      if (allFilePaths.length === 0 && Object.keys(formData.serviceCertificates).length > 0) {
        throw new Error("Không có file nào được upload thành công.");
      }

      // Only show the success toast once everything is complete
      toast.success(t("technician_register.validation.register_success"));

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      if (technicianId) {
        try {
          const deleteRes = await authApi.deleteTechnician(technicianId);

          if (deleteRes.success) {
            // Changed to error toast to inform user to retry
            toast.error("Đã hủy đăng ký do lỗi upload. Vui lòng thử lại.");
          } else {
            toast.error(
              "Đăng ký đã tạo nhưng upload thất bại. Vui lòng liên hệ support."
            );
          }
        } catch (error) {
          console.error("Error deleting technician:", error);
          toast.error(
            "Không thể hủy đăng ký tự động. Vui lòng liên hệ support."
          );
        }
      } else {
        toast.error(
          err.message ||
            "Có lỗi xảy ra khi đăng ký hoặc upload file. Vui lòng thử lại."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const ErrorMessage = ({ error }) => {
    return error ? (
      <p className="mt-1 text-sm text-red-600 flex items-center">
        <X className="w-4 h-4 mr-1 flex-shrink-0" />
        {error}
      </p>
    ) : null;
  };

  return (
    <div className="relative">
      {/* Loading Overlay */}
      {submitting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
            <p className="text-white text-lg font-medium">
              {t("technician_register.submit.submitting")}
            </p>
          </div>
        </div>
      )}
      <div className={`min-h-screen flex flex-col bg-gray-50 ${submitting ? "opacity-50" : ""}`}>
        <main className="flex-1 py-8">
          <div
            className="relative py-16"
            style={{
              backgroundImage:
                'url(https://www.etcourse.com/sites/default/files/2019-01/Highlights-Job%20Opportunities.jpg)',
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="relative max-w-6xl mx-auto px-4 text-center text-white">
              <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                <User className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {t("technician_register.title")}
              </h1>
              <p className="text-xl mb-12">{t("technician_register.subtitle")}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Star className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">
                    {t("technician_register.benefits.high_income")}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {t("technician_register.benefits.high_income_desc")}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">
                    {t("technician_register.benefits.full_insurance")}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {t("technician_register.benefits.full_insurance_desc")}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">
                    {t("technician_register.benefits.flexible_time")}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {t("technician_register.benefits.flexible_time_desc")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
        <div className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-8 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      {t("technician_register.personal_info.title")}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {t("technician_register.personal_info.subtitle")}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("technician_register.personal_info.full_name_required")}
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => updateFormData("fullName", e.target.value)}
                      className={`w-full border rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 outline-none transition-colors ${
                        validationErrors.fullName
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/50"
                      }`}
                      placeholder={t("technician_register.personal_info.full_name_placeholder")}
                    />
                    <ErrorMessage error={validationErrors.fullName} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("technician_register.personal_info.email_required")}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      className={`w-full border rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 outline-none transition-colors ${
                        validationErrors.email
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/50"
                      }`}
                      placeholder={t("technician_register.personal_info.email_placeholder")}
                    />
                    <ErrorMessage error={validationErrors.email} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("technician_register.personal_info.phone_required")}
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      className={`w-full border rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 outline-none transition-colors ${
                        validationErrors.phone
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/50"
                      }`}
                      placeholder={t("technician_register.personal_info.phone_placeholder")}
                    />
                    <ErrorMessage error={validationErrors.phone} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("technician_register.personal_info.city")} *
                    </label>
                    <select
                      value={formData.address}
                      onChange={(e) => updateFormData("address", e.target.value)}
                      className={`w-full border rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 outline-none transition-colors appearance-none ${
                        validationErrors.address
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/50"
                      }`}
                    >
                      <option value="">
                        {t("technician_register.personal_info.city_placeholder")}
                      </option>
                      {majorCities.map((city) => (
                        <option key={city.value} value={city.value}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                    <ErrorMessage error={validationErrors.address} />
                  </div>
                </div>
              </div>
              <div className="p-8 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      {t("technician_register.experience_skills.title")}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {t("technician_register.experience_skills.subtitle")}
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("technician_register.experience_skills.years_experience_required")}
                    </label>
                    <select
                      value={formData.experience}
                      onChange={(e) => updateFormData("experience", e.target.value)}
                      className={`w-full border rounded-lg px-4 py-3 focus:ring-2 outline-none transition-colors appearance-none ${
                        validationErrors.experience
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/50"
                      }`}
                    >
                      <option value="">
                        {t("technician_register.experience_skills.years_experience_placeholder")}
                      </option>
                      <option value="0-1">
                        {t("technician_register.experience_skills.experience_options.0-1")}
                      </option>
                      <option value="1-3">
                        {t("technician_register.experience_skills.experience_options.1-3")}
                      </option>
                      <option value="3-5">
                        {t("technician_register.experience_skills.experience_options.3-5")}
                      </option>
                      <option value="5-10">
                        {t("technician_register.experience_skills.experience_options.5-10")}
                      </option>
                      <option value="10+">
                        {t("technician_register.experience_skills.experience_options.10+")}
                      </option>
                    </select>
                    <ErrorMessage error={validationErrors.experience} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {t("technician_register.experience_skills.specialization_required")}
                    </label>
                    {loading ? (
                      <p className="text-gray-500">Đang tải danh sách dịch vụ...</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {services.map((service) => {
                          const serviceId = service.id;
                          const isSelected = formData.specializations.includes(serviceId);
                          const certList = formData.serviceCertificates[serviceId] || [];
                          const isMissingCert =
                            validationErrors.certificate &&
                            validationErrors.certificate.includes(serviceId);
                          return (
                            <div
                              key={serviceId}
                              className={`flex flex-col p-3 border rounded-lg bg-white ${
                                isMissingCert ? "border-red-500 ring-1 ring-red-500" : "border-gray-200"
                              }`}
                            >
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSpecialization(serviceId)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  style={{ minWidth: "1rem" }}
                                />
                                <span className="text-sm text-gray-700 font-medium">
                                  {service.name}
                                </span>
                              </label>
                              {isSelected && (
                                <div className="mt-2 space-y-2">
                                  {certList.map((cert, index) => (
                                    <div
                                      key={`${serviceId}-${cert.name}-${index}`}
                                      className="flex items-center justify-between"
                                    >
                                      <span className="text-xs text-gray-500 truncate max-w-[120px]">
                                        {cert.name}
                                      </span>
                                      <div className="flex items-center space-x-2">
                                        <button
                                          type="button"
                                          onClick={() => viewCertificate(cert)}
                                          className="text-green-600 hover:text-green-800 p-1 rounded-full bg-green-50"
                                          title={t("technician_register.experience_skills.view_file")}
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => removeCertificate(serviceId, cert.name)}
                                          className="text-red-600 hover:text-red-800 p-1 rounded-full bg-red-50"
                                          title={t("technician_register.experience_skills.remove_file")}
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  <label
                                    htmlFor={`upload-cert-${serviceId}`}
                                    className="cursor-pointer text-blue-600 hover:text-blue-800 p-1 rounded-full bg-blue-50 inline-flex items-center"
                                    title={t("technician_register.experience_skills.upload_certificate")}
                                  >
                                    <Upload className="w-4 h-4" />
                                    <span className="text-xs ml-1">Thêm file</span>
                                    <input
                                      id={`upload-cert-${serviceId}`}
                                      name={`upload-cert-${serviceId}`}
                                      type="file"
                                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                      className="sr-only"
                                      onChange={(e) =>
                                        handleCertificateUpload(e.target.files[0], serviceId)
                                      }
                                      onClick={(e) => {
                                        e.target.value = null;
                                      }}
                                    />
                                  </label>
                                  {isMissingCert && (
                                    <p className="mt-1 text-xs text-red-600 flex items-center">
                                      <X className="w-3 h-3 mr-1 flex-shrink-0" />
                                      {t("technician_register.validation.certificate_required_error")}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {validationErrors.specializations && (
                          <div className="md:col-span-2">
                            <ErrorMessage error={validationErrors.specializations} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-8 flex flex-col items-center">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      {t("technician_register.terms.title")}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {t("technician_register.terms.subtitle")}
                    </p>
                  </div>
                </div>
                <div className="space-y-4 mb-8">
                  <label className="flex flex-col items-start gap-1 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formData.agreeToTerms}
                        onChange={(e) => updateFormData("agreeToTerms", e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1 flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700">
                        {t("technician_register.terms.agree_terms")}{" "}
                        <span className="text-blue-600 underline">
                          {t("technician_register.terms.terms_of_use")}
                        </span>{" "}
                        {t("technician_register.terms.and")}{" "}
                        <span className="text-blue-600 underline">
                          {t("technician_register.terms.privacy_policy")}
                        </span>{" "}
                        {t("technician_register.terms.of_platform")}
                      </span>
                    </div>
                    {validationErrors.agreeToTerms && (
                      <div className="ml-7">
                        <ErrorMessage error={validationErrors.agreeToTerms} />
                      </div>
                    )}
                  </label>
                  <label className="flex flex-col items-start gap-1 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formData.agreeToBackgroundCheck}
                        onChange={(e) =>
                          updateFormData("agreeToBackgroundCheck", e.target.checked)
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1 flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700">
                        {t("technician_register.terms.agree_background_check")}
                      </span>
                    </div>
                    {validationErrors.agreeToBackgroundCheck && (
                      <div className="ml-7">
                        <ErrorMessage error={validationErrors.agreeToBackgroundCheck} />
                      </div>
                    )}
                  </label>
                </div>
                <div className="text-center">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || loading}
                    className="bg-blue-600 text-white px-12 py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-60 flex items-center justify-center"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {t("technician_register.submit.submitting")}
                      </>
                    ) : (
                      t("technician_register.submit.register_now")
                    )}
                  </button>
                </div>
              </div>
              <div className="text-center mt-8 text-gray-600 pb-12">
                <p className="mb-2">{t("technician_register.submit.need_support")}</p>
                <div className="flex items-center justify-center gap-6">
                  <a
                    href="mailto:support@homeservice.com"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Mail className="w-4 h-4" />
                    {t("technician_register.submit.support_email")}
                  </a>
                  <a
                    href="tel:1900-1234"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Phone className="w-4 h-4" />
                    {t("technician_register.submit.support_phone")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-800">{previewImage.name}</h3>
              <button
                onClick={closePreview}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {previewImage.url.startsWith("blob:http") && (
                <img
                  src={previewImage.url}
                  alt={previewImage.name}
                  className="max-w-full h-auto mx-auto"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}