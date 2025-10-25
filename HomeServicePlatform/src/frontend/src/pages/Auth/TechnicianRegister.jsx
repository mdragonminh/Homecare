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
} from "lucide-react";
import { authApi } from "../../services/authApi";
import { serviceApi } from "../../services/serviceApi";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function TechnicianRegister({
  loggedInUser,
  onLogout,
  onShowLogin,
  onShowRegister,
}) {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    experience: "",
    specializations: [],
    serviceCertificates: {}, // { serviceId: { file: File, name: string } }
    bio: "",
    agreeToTerms: false,
    agreeToBackgroundCheck: false,
  });
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
  };

  const toggleSpecialization = (serviceId) => {
    const isSelected = formData.specializations.includes(serviceId);
    
    updateFormData(
      "specializations",
      isSelected
        ? formData.specializations.filter((s) => s !== serviceId)
        : [...formData.specializations, serviceId]
    );

    if (isSelected && formData.serviceCertificates[serviceId]) {
      setFormData((prev) => {
        const newCerts = { ...prev.serviceCertificates };
        delete newCerts[serviceId];
        return { ...prev, serviceCertificates: newCerts };
      });
    }
  };

  // Chỉ lưu file tạm, không upload ngay
  const handleCertificateUpload = useCallback(
    async (file, serviceId) => {
      if (!file) return;

      const maxFileSize = 5 * 1024 * 1024; // 5MB
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

      // Chỉ lưu File object vào state, chưa upload
      setFormData((prev) => ({
        ...prev,
        serviceCertificates: {
          ...prev.serviceCertificates,
          [serviceId]: {
            file: file,
            name: file.name,
          },
        },
      }));
      
      toast.success(`Đã chọn file: ${file.name}`);
    },
    [t]
  );

  const removeCertificate = (serviceId) => {
    setFormData((prev) => {
      const newCerts = { ...prev.serviceCertificates };
      delete newCerts[serviceId];
      return { ...prev, serviceCertificates: newCerts };
    });
    toast.info(t("technician_register.experience_skills.file_removed"));
  };
  
  // Preview ảnh trong popup
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

  const handleSubmit = async () => {
    // Validate
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.experience ||
      formData.specializations.length === 0 ||
      !formData.agreeToTerms ||
      !formData.agreeToBackgroundCheck
    ) {
      toast.error(t("technician_register.validation.fill_required_fields"));
      return;
    }

    // Validate: Kiểm tra xem tất cả specializations đã có certificate chưa
    const missingCertificates = formData.specializations.filter(
      serviceId => !formData.serviceCertificates[serviceId]?.file
    );
    
    if (missingCertificates.length > 0) {
      const missingServices = missingCertificates.map(id => {
        const service = services.find(s => s.id === id);
        return service?.name || `Service ${id}`;
      }).join(", ");
      
      toast.error(
        `Vui lòng chọn chứng chỉ cho các dịch vụ: ${missingServices}`
      );
      return;
    }

    try {
      setSubmitting(true);
      
      // Upload tất cả certificates trước khi đăng ký
      toast.info("Đang upload chứng chỉ...");
      
      const uploadPromises = formData.specializations.map(async (serviceId) => {
        const certData = formData.serviceCertificates[serviceId];
        if (!certData?.file) return null;
        
        try {
          const response = await authApi.uploadFile(
            certData.file,
            serviceId.toString(),
            "Technician",
            "Certificate"
          );
          
          if (response.success && response.data?.filePath) {
            return response.data.filePath;
          }
          throw new Error(`Upload failed for service ${serviceId}`);
        } catch (error) {
          console.error(`Upload error for service ${serviceId}:`, error);
          throw error;
        }
      });
      
      const certificateFilePaths = await Promise.all(uploadPromises);
      const validPaths = certificateFilePaths.filter(path => path);
      
      if (validPaths.length !== formData.specializations.length) {
        toast.error("Có lỗi khi upload một số chứng chỉ. Vui lòng thử lại.");
        return;
      }
      
      toast.success("Upload chứng chỉ thành công!");
      
      // Lấy tên services từ IDs
      const selectedSpecializations = formData.specializations.map(id => {
        const service = services.find(s => s.id === id);
        return service?.name || "";
      }).filter(name => name !== "");

      // Sử dụng prepareRegisterTechnicianData helper
      const preparedData = authApi.prepareRegisterTechnicianData({
        email: formData.email,
        fullName: formData.fullName,
        phoneNumber: formData.phone,
        specializations: selectedSpecializations,
        experience: formData.experience,
        bio: formData.bio,
        certifications: "",
        availability: [],
      });

      // Gọi API đăng ký với certificateFilePaths đã upload
      const res = await authApi.registerTechnician({
        ...preparedData,
        certificateFilePaths: validPaths,
      });

      if (res.success) {
        toast.success(t("technician_register.validation.register_success"));
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        toast.error(
          res.message || t("technician_register.validation.register_failed")
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <main className="flex-1 py-8">
          <div
            className="relative py-16"
            style={{
              backgroundImage:
                "url('https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcTUvYMVwAgyyFHCZJc0lf74j85foiW-5tcp_0-Utq6btFnaDOiTCegimm48frzL8bcctQjWbSro5jXndDUSN-FIUaQnODNtA3KkalUdQGxF5-I4MnA')",
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
              <p className="text-xl mb-12">
                {t("technician_register.subtitle")}
              </p>
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
              {/* Thông Tin Cá Nhân */}
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
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors"
                      placeholder={t("technician_register.personal_info.full_name_placeholder")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("technician_register.personal_info.email_required")}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors"
                      placeholder={t("technician_register.personal_info.email_placeholder")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("technician_register.personal_info.phone_required")}
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors"
                      placeholder={t("technician_register.personal_info.phone_placeholder")}
                    />
                  </div>
                </div>
              </div>

              {/* Kinh Nghiệm & Kỹ Năng */}
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
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
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
                          const certInfo = formData.serviceCertificates[serviceId];

                          return (
                            <div
                              key={serviceId}
                              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white"
                            >
                              <label className="flex items-center gap-3 cursor-pointer flex-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSpecialization(serviceId)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                                  style={{ minWidth: "1rem" }}
                                />
                                <span className="text-sm text-gray-700 font-medium">
                                  {service.name}
                                </span>
                              </label>

                              {isSelected && (
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  {certInfo?.file ? (
                                    <>
                                      <span className="text-xs text-gray-500 truncate max-w-[80px]">
                                        {certInfo.name}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => viewCertificate(certInfo)}
                                        className="text-green-600 hover:text-green-800 p-1 rounded-full bg-green-50"
                                        title={t("technician_register.experience_skills.view_file")}
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => removeCertificate(serviceId)}
                                        className="text-red-600 hover:text-red-800 p-1 rounded-full bg-red-50"
                                        title={t("technician_register.experience_skills.remove_file")}
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <label
                                      htmlFor={`upload-cert-${serviceId}`}
                                      className="cursor-pointer text-blue-600 hover:text-blue-800 p-1 rounded-full bg-blue-50"
                                      title={t("technician_register.experience_skills.upload_certificate")}
                                    >
                                      <Upload className="w-4 h-4" />
                                      <input
                                        id={`upload-cert-${serviceId}`}
                                        name={`upload-cert-${serviceId}`}
                                        type="file"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        className="sr-only"
                                        onChange={(e) =>
                                          handleCertificateUpload(e.target.files[0], serviceId)
                                        }
                                      />
                                    </label>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Điều khoản */}
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
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={(e) => updateFormData("agreeToTerms", e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
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
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreeToBackgroundCheck}
                      onChange={(e) => updateFormData("agreeToBackgroundCheck", e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                    />
                    <span className="text-sm text-gray-700">
                      {t("technician_register.terms.agree_background_check")}
                    </span>
                  </label>
                </div>

                <div className="text-center">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || loading}
                    className="bg-blue-600 text-white px-12 py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-60"
                  >
                    {submitting
                      ? t("technician_register.submit.submitting")
                      : t("technician_register.submit.register_now")}
                  </button>
                </div>
              </div>

              <div className="text-center mt-8 text-gray-600 pb-12">
                <p className="mb-2">
                  {t("technician_register.submit.need_support")}
                </p>
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

      {/* Image Preview Popup */}
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
              <img 
                src={previewImage.url} 
                alt={previewImage.name}
                className="max-w-full h-auto mx-auto"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}