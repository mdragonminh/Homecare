import { useState, useEffect } from "react";
import {
  Upload,
  User,
  Briefcase,
  FileText,
  Award,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Star,
  Clock,
  DollarSign,
  CheckCircle,
  Shield,
  Zap,
} from "lucide-react";
import { authApi } from "../../services/authApi";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
const SPECIALIZATION_KEYS = [
  "electrical",
  "plumbing",
  "ac",
  "electronics",
  "painting",
  "cleaning",
  "gardening",
  "interior",
  "installation",
  "maintenance",
];

const AVAILABILITY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function TechnicianRegister({
  loggedInUser,
  onLogout,
  onShowLogin,
  onShowRegister,
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    city: "",
    experience: "",
    specializations: [],
    certificateFiles: [], // Array của File objects
    certificateFilePaths: [], // Array của file paths từ server
    availability: [],
    hourlyRate: "",
    bio: "",
    portfolio: null, // Tên file
    idDocument: null, // Tên file
    agreeToTerms: false,
    agreeToBackgroundCheck: false,
  });
  const [loading, setLoading] = useState(false);
  const [uploadingCertificates, setUploadingCertificates] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success | error
  const navigate = useNavigate();

  // 💡 LOGIC KIỂM TRA ĐĂNG NHẬP VÀ CHUYỂN HƯỚNG
  useEffect(() => {
    if (loggedInUser) {
      // Chuyển hướng nếu đã đăng nhập
      navigate("/");
    }
  }, [loggedInUser, navigate]);

  const handleBackToHome = () => {
    navigate("/");
  };

  const [submitting, setSubmitting] = useState(false);

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field, file) => {
    // Chỉ lưu tên file cho mục đích minh họa
    if (file) {
      updateFormData(field, file.name);
    } else {
      updateFormData(field, null);
    }
  };

  const toggleSpecialization = (specKey) => {
    updateFormData(
      "specializations",
      formData.specializations.includes(specKey)
        ? formData.specializations.filter((s) => s !== specKey)
        : [...formData.specializations, specKey]
    );
  };

  const toggleAvailability = (dayKey) => {
    updateFormData(
      "availability",
      formData.availability.includes(dayKey)
        ? formData.availability.filter((d) => d !== dayKey)
        : [...formData.availability, dayKey]
    );
  };

  const handleCertificateUpload = async (files) => {
    if (!files || files.length === 0) return;

    // Validate files
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const validFiles = Array.from(files).filter((file) => {
      if (file.size > maxFileSize) {
        toast.error(`File ${file.name} quá lớn (tối đa 5MB)`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          `File ${file.name} không đúng định dạng (chỉ chấp nhận PDF, DOC, DOCX, JPG, PNG)`
        );
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    try {
      setUploadingCertificates(true);
      const response = await authApi.uploadCertificates(validFiles);

      if (response.success) {
        updateFormData("certificateFiles", [
          ...formData.certificateFiles,
          ...validFiles,
        ]);
        updateFormData("certificateFilePaths", [
          ...formData.certificateFilePaths,
          ...response.data.filePaths,
        ]);
        toast.success(
          `Đã upload ${validFiles.length} file chứng chỉ thành công!`
        );
      } else {
        toast.error(response.message || "Upload chứng chỉ thất bại");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Có lỗi xảy ra khi upload chứng chỉ");
    } finally {
      setUploadingCertificates(false);
    }
  };

  const removeCertificate = (index) => {
    const newFiles = [...formData.certificateFiles];
    const newPaths = [...formData.certificateFilePaths];
    newFiles.splice(index, 1);
    newPaths.splice(index, 1);
    updateFormData("certificateFiles", newFiles);
    updateFormData("certificateFilePaths", newPaths);
  };

  const handleSubmit = async () => {
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

    try {
      setSubmitting(true);
      const res = await authApi.registerTechnician({
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone,
        specializations: formData.specializations,
        experience: formData.experience,
        bio: formData.bio,
        availability: formData.availability,
        address: formData.address,
        city: formData.city,
        hourlyRate: formData.hourlyRate,
        certificateFilePaths: formData.certificateFilePaths,
      });

      if (res.success) {
        toast.success(t("technician_register.validation.register_success"));
      } else {
        toast.error(
          res.message || t("technician_register.validation.register_failed")
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(t("technician_register.validation.error_occurred"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Main Content */}
        <main className="flex-1 py-8">
          <div
            className="relative py-16"
            style={{
              backgroundImage:
                "url('https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcTUvYMVwAgyyFHCZJc0lf74j85foiW-5tcp_0-Utq6btFnaDOiTCegimm48frzL8bcctQjWbSro5jXndDUSN-FIUaQnODNtA3KkalUdQGxF5-I4MnA')", // 👉 đổi ảnh
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Overlay để chữ dễ đọc */}
            <div className="absolute inset-0 bg-black/30"></div>

            <div className="relative max-w-6xl mx-auto px-4 text-center text-white">
              {/* Logo */}
              <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                <User className="w-10 h-10 text-white" />
              </div>

              {/* Tiêu đề chính */}
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {t("technician_register.title")}
              </h1>
              <p className="text-xl mb-12">
                {t("technician_register.subtitle")}
              </p>

              {/* 3 cards benefit */}
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

        {/* Form Section */}
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
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t(
                        "technician_register.personal_info.full_name_required"
                      )}
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) =>
                        updateFormData("fullName", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors"
                      placeholder={t(
                        "technician_register.personal_info.full_name_placeholder"
                      )}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("technician_register.personal_info.email_required")}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors"
                      placeholder={t(
                        "technician_register.personal_info.email_placeholder"
                      )}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("technician_register.personal_info.phone_required")}
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors"
                      placeholder={t(
                        "technician_register.personal_info.phone_placeholder"
                      )}
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("technician_register.personal_info.date_of_birth")}
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        updateFormData("dateOfBirth", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      placeholder="dd/mm/yyyy"
                    />
                  </div>

                  {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateFormData("address", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Số nhà, tên đường, phường/xã"
                  />
                </div>

                {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("technician_register.personal_info.city")}
                    </label>
                    <select
                      value={formData.city}
                      onChange={(e) => updateFormData("city", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors"
                    >
                      <option value="">
                        {t(
                          "technician_register.personal_info.city_placeholder"
                        )}
                      </option>
                      <option value="hanoi">
                        {t("technician_register.personal_info.cities.hanoi")}
                      </option>
                      <option value="hcm">
                        {t("technician_register.personal_info.cities.hcm")}
                      </option>
                      <option value="danang">
                        {t("technician_register.personal_info.cities.danang")}
                      </option>
                      <option value="haiphong">
                        {t("technician_register.personal_info.cities.haiphong")}
                      </option>
                      <option value="cantho">
                        {t("technician_register.personal_info.cities.cantho")}
                      </option>
                    </select>
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
                  {/* Experience */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t(
                        "technician_register.experience_skills.years_experience_required"
                      )}
                    </label>
                    <select
                      value={formData.experience}
                      onChange={(e) =>
                        updateFormData("experience", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    >
                      <option value="">
                        {t(
                          "technician_register.experience_skills.years_experience_placeholder"
                        )}
                      </option>
                      <option value="0-1">
                        {t(
                          "technician_register.experience_skills.experience_options.0-1"
                        )}
                      </option>
                      <option value="1-3">
                        {t(
                          "technician_register.experience_skills.experience_options.1-3"
                        )}
                      </option>
                      <option value="3-5">
                        {t(
                          "technician_register.experience_skills.experience_options.3-5"
                        )}
                      </option>
                      <option value="5-10">
                        {t(
                          "technician_register.experience_skills.experience_options.5-10"
                        )}
                      </option>
                      <option value="10+">
                        {t(
                          "technician_register.experience_skills.experience_options.10+"
                        )}
                      </option>
                    </select>
                  </div>

                  {/* Specializations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {t(
                        "technician_register.experience_skills.specialization_required"
                      )}
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {SPECIALIZATION_KEYS.map((specKey) => (
                        <label
                          key={specKey}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.specializations.includes(specKey)}
                            onChange={() => toggleSpecialization(specKey)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            style={{ minWidth: "1rem" }}
                          />
                          {t(
                            `technician_register.experience_skills.specializations.${specKey}`
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Upload Certificates */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t(
                        "technician_register.experience_skills.certifications"
                      )}
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label
                            htmlFor="certificates-upload"
                            className="cursor-pointer"
                          >
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              {uploadingCertificates
                                ? "Đang upload..."
                                : "Chọn file chứng chỉ để upload"}
                            </span>
                            <span className="mt-1 block text-xs text-gray-500">
                              PDF, DOC, DOCX, JPG, PNG (tối đa 5MB mỗi file)
                            </span>
                            <input
                              id="certificates-upload"
                              name="certificates-upload"
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              className="sr-only"
                              onChange={(e) =>
                                handleCertificateUpload(e.target.files)
                              }
                              disabled={uploadingCertificates}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Display uploaded files */}
                    {formData.certificateFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          Các file đã upload ({formData.certificateFiles.length}
                          ):
                        </p>
                        <div className="space-y-2">
                          {formData.certificateFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <span className="text-sm text-gray-700 truncate max-w-xs">
                                  {file.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({Math.round(file.size / 1024)}KB)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCertificate(index)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Xóa
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {t("technician_register.experience_skills.availability")}
                    </label>
                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                      {AVAILABILITY_KEYS.map((dayKey) => (
                        <label
                          key={dayKey}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.availability.includes(dayKey)}
                            onChange={() => toggleAvailability(dayKey)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {t(
                              `technician_register.experience_skills.availability_options.${dayKey}`
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("technician_register.rate_bio.hourly_rate_required")}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) =>
                      updateFormData("hourlyRate", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg pl-4 pr-16 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors"
                    placeholder={t("technician_register.rate_bio.hourly_rate_placeholder")}
                  />
                  <span className="absolute right-0 top-0 h-full flex items-center pr-4 text-gray-500 text-sm font-medium">
                    {t("technician_register.rate_bio.hourly_rate_unit")}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("technician_register.rate_bio.bio_required")}
                </label>
                <textarea
                  rows={5}
                  value={formData.bio}
                  onChange={(e) => updateFormData("bio", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors resize-none"
                  placeholder={t("technician_register.rate_bio.bio_placeholder")}
                />
              </div> */}
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
                  onChange={(e) =>
                    updateFormData("agreeToTerms", e.target.checked)
                  }
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
                  onChange={(e) =>
                    updateFormData("agreeToBackgroundCheck", e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                />
                <span className="text-sm text-gray-700">
                  {t("technician_register.terms.agree_background_check")}
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-blue-600 text-white px-12 py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-60"
              >
                {submitting
                  ? t("technician_register.submit.submitting")
                  : t("technician_register.submit.register_now")}
              </button>
            </div>
          </div>

          {/* Footer */}
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
  );
}
