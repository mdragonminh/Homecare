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
  Loader2,
} from "lucide-react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import useTechnicianRegister, {
  majorCities,
} from "../../hooks/useTechnicianRegister";
import React from "react";
const ErrorMessage = ({ error }) => {
  return error ? (
    <p className="mt-1 text-sm text-red-600 flex items-center">
      <X className="w-4 h-4 mr-1 flex-shrink-0" />
      {error}
    </p>
  ) : null;
};

function TechnicianRegister({ loggedInUser }) {
  const {
    formData,
    validationErrors,
    services,
    loading,
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
    handleAvatarUpload,
    removeAvatar,
    handleCitizenIdUpload,
    removeCitizenIdFile,
    handleLegalDocumentUpload,
    removeLegalDocumentFile,
    handleSubmit,
    t,
  } = useTechnicianRegister(loggedInUser);
  const getCitizenIdCertData = () => {
    if (!formData.citizenIdFile) return null;
    return {
      file: formData.citizenIdFile,
      name: formData.citizenIdFile.name,
      url: previewCitizenId,
    };
  };
  const getLegalDocumentData = () => {
    if (!formData.legalDocumentFile) return null;
    return {
      file: formData.legalDocumentFile,
      name: formData.legalDocumentFile.name,
      url: previewLegalDocument,
    };
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
      <div
        className={`min-h-screen flex flex-col bg-gray-50 ${
          submitting ? "opacity-50" : ""
        }`}
      >
        <main className="flex-1 py-8">
          <div
            className="relative py-16"
            style={{
              backgroundImage:
                "url(https://www.etcourse.com/sites/default/files/2019-01/Highlights-Job%20Opportunities.jpg)",
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
              {/* Personal Info Section (Bắt đầu từ đây) */}
              <div className="p-8 border-b border-gray-100">
                <div className="flex items-start gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {t("technician_register.personal_info.title")}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {t("technician_register.personal_info.subtitle")}
                    </p>
                  </div>
                </div>

                {/* Avatar + Name and Email Row */}
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-900 mb-3 ml-1">
                    {t("technician_register.personal_info.avatar_required")}
                  </label>
                  <div className="flex items-start gap-6">
                    <div className="flex flex-col flex-shrink-0 w-48">
                      {/* Avatar Upload Circle */}
                      <div className="relative w-48 h-48">
                        {formData.avatarFile ? (
                          <>
                            <img
                              src={
                                previewImage?.url ||
                                URL.createObjectURL(formData.avatarFile)
                              }
                              alt="Avatar Preview"
                              className="w-full h-full object-cover rounded-full border-4 border-gray-200 shadow-sm"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity space-x-2">
                              <button
                                type="button"
                                onClick={() =>
                                  viewCertificate({
                                    file: formData.avatarFile,
                                    name: formData.avatarFile.name,
                                  })
                                }
                                className="p-2 rounded-full bg-white text-blue-600 hover:bg-gray-100 transition-colors"
                                title={t(
                                  "technician_register.personal_info.view_avatar"
                                )}
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                              <button
                                type="button"
                                onClick={removeAvatar}
                                className="p-2 rounded-full bg-white text-red-600 hover:bg-gray-100 transition-colors"
                                title={t(
                                  "technician_register.personal_info.remove_avatar"
                                )}
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <label
                            htmlFor="upload-avatar"
                            className="w-full h-full cursor-pointer bg-gray-100 rounded-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                            title={t(
                              "technician_register.personal_info.upload_avatar"
                            )}
                          >
                            <Upload className="w-10 h-10 text-gray-400 group-hover:text-blue-600 transition-colors" />
                            <span className="text-sm text-gray-500 mt-2 group-hover:text-blue-600">
                              {t(
                                "technician_register.personal_info.upload_prompt"
                              ) || "Thêm ảnh"}
                            </span>
                          </label>
                        )}
                        <input
                          id="upload-avatar"
                          name="upload-avatar"
                          type="file"
                          className="sr-only"
                          onChange={(e) =>
                            handleAvatarUpload(e.target.files[0])
                          }
                          onClick={(e) => {
                            e.target.value = null;
                          }}
                        />
                      </div>
                      {(validationErrors.avatarFile ||
                        validationErrors.avatarUploadError) && (
                        <div className="mt-2">
                          {validationErrors.avatarFile && (
                            <ErrorMessage error={validationErrors.avatarFile} />
                          )}
                          {validationErrors.avatarUploadError && (
                            <ErrorMessage
                              error={validationErrors.avatarUploadError}
                            />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-start gap-4 h-48">
                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2 ml-1">
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
                          className={`w-full border rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 outline-none transition-all ${
                            validationErrors.fullName
                              ? "border-red-500 focus:border-red-500 focus:ring-red-100 bg-red-50"
                              : "border-gray-300 focus:border-blue-500 focus:ring-blue-100 bg-white"
                          }`}
                          placeholder={t(
                            "technician_register.personal_info.full_name_placeholder"
                          )}
                        />
                        <ErrorMessage error={validationErrors.fullName} />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2 ml-1">
                          {t(
                            "technician_register.personal_info.email_required"
                          )}
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            updateFormData("email", e.target.value)
                          }
                          className={`w-full border rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 outline-none transition-all ${
                            validationErrors.email
                              ? "border-red-500 focus:border-red-500 focus:ring-red-100 bg-red-50"
                              : "border-gray-300 focus:border-blue-500 focus:ring-blue-100 bg-white"
                          }`}
                          placeholder={t(
                            "technician_register.personal_info.email_placeholder"
                          )}
                        />
                        <ErrorMessage error={validationErrors.email} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phone and City Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2 ml-1">
                      {t("technician_register.personal_info.phone_required")}
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      className={`w-full border rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 outline-none transition-all ${
                        validationErrors.phone
                          ? "border-red-500 focus:border-red-500 focus:ring-red-100 bg-red-50"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-100 bg-white"
                      }`}
                      placeholder={t(
                        "technician_register.personal_info.phone_placeholder"
                      )}
                    />
                    <ErrorMessage error={validationErrors.phone} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2 ml-1">
                      {t("technician_register.personal_info.city")} *
                    </label>
                    <select
                      value={formData.address}
                      onChange={(e) =>
                        updateFormData("address", e.target.value)
                      }
                      className={`w-full border rounded-lg px-4 py-3 text-gray-900 focus:ring-2 outline-none transition-all appearance-none ${
                        validationErrors.address
                          ? "border-red-500 focus:border-red-500 focus:ring-red-100 bg-red-50"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-100 bg-white"
                      }`}
                    >
                      <option value="">
                        {t(
                          "technician_register.personal_info.city_placeholder"
                        )}
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

                {/* Password Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2 ml-1">
                      {t("technician_register.personal_info.password_required")}
                    </label>
                    <input
                      type="password"
                      value={formData.password || ""}
                      onChange={(e) =>
                        updateFormData("password", e.target.value)
                      }
                      className={`w-full border rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 outline-none transition-all ${
                        validationErrors.password
                          ? "border-red-500 focus:border-red-500 focus:ring-red-100 bg-red-50"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-100 bg-white"
                      }`}
                      placeholder={t(
                        "technician_register.personal_info.password_placeholder"
                      )}
                    />
                    <ErrorMessage error={validationErrors.password} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2 ml-1">
                      {t(
                        "technician_register.personal_info.confirm_password_required"
                      )}
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword || ""}
                      onChange={(e) =>
                        updateFormData("confirmPassword", e.target.value)
                      }
                      className={`w-full border rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 outline-none transition-all ${
                        validationErrors.confirmPassword
                          ? "border-red-500 focus:border-red-500 focus:ring-red-100 bg-red-50"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-100 bg-white"
                      }`}
                      placeholder={t(
                        "technician_register.personal_info.confirm_password_placeholder"
                      )}
                    />
                    <ErrorMessage error={validationErrors.confirmPassword} />
                  </div>
                </div>
              </div>
              {/* Personal Info Section (Kết thúc ở đây) */}
              <div className="p-8 border-b border-gray-100">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {t("technician_register.citizen_id.title") ||
                        "Thông tin Căn cước công dân"}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {t("technician_register.citizen_id.subtitle") ||
                        "Quét ảnh CCCD để tự động điền thông tin và xác minh danh tính."}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2 ml-1">
                      {t("technician_register.citizen_id.upload_required") ||
                        "Tải lên ảnh CCCD (Mặt trước)"}{" "}
                      *
                    </label>

                    <div className="relative border-2 border-dashed rounded-lg flex items-center justify-center w-96 h-50 mx-auto">
                      {loading ? (
                        <div className="flex items-center text-blue-600 p-4">
                          {/* Icon: Loader2 */}
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {t("technician_register.ocr.scanning") ||
                            "Đang quét OCR..."}
                        </div>
                      ) : previewCitizenId ? (
                        <>
                          {formData.citizenIdFile.type.startsWith("image/") ? (
                            <img
                              src={previewCitizenId}
                              alt="Citizen ID Preview"
                              className="h-full w-full object-contain p-2 rounded-lg"
                            />
                          ) : (
                            <div className="flex flex-col items-center text-red-600">
                              <FileText className="w-10 h-10" />
                              <span className="text-sm mt-2">
                                {formData.citizenIdFile.name}
                              </span>
                            </div>
                          )}

                          {/* Action Overlay */}
                          <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity space-x-2">
                            <button
                              type="button"
                              onClick={() =>
                                viewCertificate(getCitizenIdCertData())
                              }
                              className="p-2 rounded-full bg-white text-blue-600 hover:bg-gray-100 transition-colors"
                              title={
                                t(
                                  "technician_register.personal_info.view_avatar"
                                ) || "Xem ảnh"
                              }
                            >
                              {/* Icon: Eye */}
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={removeCitizenIdFile}
                              className="p-2 rounded-full bg-white text-red-600 hover:bg-gray-100 transition-colors"
                              title={
                                t(
                                  "technician_register.personal_info.remove_avatar"
                                ) || "Xóa ảnh"
                              }
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <label
                          htmlFor="citizenIdFile"
                          className={`flex flex-col items-center justify-center w-full h-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50 ${
                            validationErrors.citizenIdFile
                              ? "border-red-500 ring-1 ring-red-500 bg-red-50"
                              : "border-gray-300"
                          }`}
                        >
                          <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-600 transition-colors" />
                          <span className="text-sm text-gray-500 mt-2 group-hover:text-blue-600">
                            {t("technician_register.ocr.click_to_upload") ||
                              "Nhấp để tải lên (JPG, PNG, PDF)"}
                          </span>
                        </label>
                      )}

                      <input
                        id="citizenIdFile"
                        type="file"
                        accept="image/jpeg, image/png, application/pdf"
                        className="sr-only"
                        onChange={(e) =>
                          handleCitizenIdUpload(e.target.files[0])
                        }
                        disabled={loading || submitting}
                        onClick={(e) => {
                          e.target.value = null;
                        }}
                      />
                    </div>
                    <ErrorMessage error={validationErrors.citizenIdFile} />
                  </div>
                  <div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2 ml-1">
                        {t("technician_register.citizen_id.number_required") ||
                          "Số Căn cước công dân"}{" "}
                        *
                      </label>
                      <input
                        type="text"
                        value={formData.citizenId}
                        onChange={(e) =>
                          updateFormData("citizenId", e.target.value)
                        }
                        className={`w-full border rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 outline-none transition-all ${
                          validationErrors.citizenId
                            ? "border-red-500 focus:border-red-500 focus:ring-red-100 bg-red-50"
                            : formData.citizenId
                            ? "border-green-500 focus:border-green-500 focus:ring-green-100 bg-white"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-100 bg-white"
                        }`}
                        placeholder={
                          t(
                            "technician_register.citizen_id.number_placeholder"
                          ) || "Số CCCD"
                        }
                        disabled={submitting}
                      />
                      <ErrorMessage error={validationErrors.citizenId} />
                      {formData.citizenId && !loading && (
                        <p className="mt-1 text-xs text-green-600 flex items-center">
                          <span className="mr-1"></span>
                          {t("technician_register.ocr.auto_filled_note") ||
                            "Đã điền (tự động hoặc thủ công). Vui lòng kiểm tra lại."}
                        </p>
                      )}
                    </div>
                    <div className="mt-6">
                      <label className="block text-sm font-semibold text-gray-900 mb-2 ml-1">
                        {t("technician_register.legal_document.title") ||
                          "Sơ Yếu Lý Lịch"}{" "}
                        *
                      </label>
                      <div
                        className={`border rounded-lg p-3 bg-white ${
                          validationErrors.legalDocumentFile
                            ? "border-red-500 ring-1 ring-red-500 bg-red-50"
                            : "border-gray-300"
                        }`}
                      >
                        <div className="space-y-2">
                          {formData.legalDocumentFile ? (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 truncate max-w-[180px]">
                                {formData.legalDocumentFile.name}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    viewCertificate(getLegalDocumentData())
                                  }
                                  className="p-1.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                  title="Xem file"
                                >
                                  {/* Icon: Eye */}
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                <label
                                  htmlFor="upload-legal-document"
                                  className="p-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                                  title="Thay file"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                </label>

                                <button
                                  type="button"
                                  onClick={removeLegalDocumentFile}
                                  className="p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                  title="Xóa file"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label
                              htmlFor="upload-legal-document"
                              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-full cursor-pointer hover:bg-blue-100 transition-colors"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Tải lên</span>
                            </label>
                          )}
                        </div>
                        {/* SỬ DỤNG ErrorMessage component */}
                        <ErrorMessage
                          error={validationErrors.legalDocumentFile}
                        />
                        <input
                          id="upload-legal-document"
                          type="file"
                          accept="image/jpeg,image/png,application/pdf"
                          className="sr-only"
                          onChange={(e) =>
                            handleLegalDocumentUpload(e.target.files[0])
                          }
                          onClick={(e) => {
                            e.target.value = null;
                          }}
                          disabled={loading || submitting}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* END CCCD (Citizen ID) Upload Section */}
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
                      {t(
                        "technician_register.experience_skills.years_experience_required"
                      )}
                    </label>
                    <select
                      value={formData.experience}
                      onChange={(e) =>
                        updateFormData("experience", e.target.value)
                      }
                      className={`w-full border rounded-lg px-4 py-3 focus:ring-2 outline-none transition-colors appearance-none ${
                        validationErrors.experience
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/50"
                      }`}
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
                    <ErrorMessage error={validationErrors.experience} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {t(
                        "technician_register.experience_skills.specialization_required"
                      )}
                      <ErrorMessage error={validationErrors.specializations} />
                    </label>
                    {loading ? (
                      <p className="text-gray-500">
                        Đang tải danh sách dịch vụ...
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {services.map((service) => {
                          const serviceId = service.id;
                          const isSelected =
                            formData.specializations.includes(serviceId);
                          const certList =
                            formData.serviceCertificates[serviceId] || [];

                          const uploadError =
                            validationErrors.certificateUploadErrors?.[
                              serviceId
                            ];
                          const isMissingCert =
                            validationErrors.certificate &&
                            validationErrors.certificate.includes(serviceId);
                          const beError =
                            validationErrors.certificateBeErrors?.[serviceId];
                          const hasError =
                            isMissingCert || uploadError || beError;

                          return (
                            <div
                              key={serviceId}
                              className={`flex flex-col p-3 border rounded-lg bg-white ${
                                hasError
                                  ? "border-red-500 ring-1 ring-red-500"
                                  : "border-gray-200"
                              }`}
                            >
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    toggleSpecialization(serviceId)
                                  }
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
                                          title={t(
                                            "technician_register.experience_skills.view_file"
                                          )}
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeCertificate(
                                              serviceId,
                                              cert.name
                                            )
                                          }
                                          className="text-red-600 hover:text-red-800 p-1 rounded-full bg-red-50"
                                          title={t(
                                            "technician_register.experience_skills.remove_file"
                                          )}
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  <label
                                    htmlFor={`upload-cert-${serviceId}`}
                                    className="cursor-pointer text-blue-600 hover:text-blue-800 p-1 rounded-full bg-blue-50 inline-flex items-center"
                                    title={t(
                                      "technician_register.experience_skills.upload_certificate"
                                    )}
                                  >
                                    <Upload className="w-4 h-4" />
                                    <span className="text-xs ml-1">
                                      Thêm file
                                    </span>
                                    <input
                                      id={`upload-cert-${serviceId}`}
                                      name={`upload-cert-${serviceId}`}
                                      type="file"
                                      className="sr-only"
                                      onChange={(e) =>
                                        handleCertificateUpload(
                                          e.target.files[0],
                                          serviceId
                                        )
                                      }
                                      onClick={(e) => {
                                        e.target.value = null;
                                      }}
                                    />
                                  </label>

                                  {uploadError && (
                                    <p className="mt-1 text-xs text-red-600 flex items-center">
                                      <X className="w-3 h-3 mr-1 flex-shrink-0" />
                                      {uploadError}{" "}
                                    </p>
                                  )}

                                  {isMissingCert && !uploadError && (
                                    <p className="mt-1 text-xs text-red-600 flex items-center">
                                      <X className="w-3 h-3 mr-1 flex-shrink-0" />
                                      {t(
                                        "technician_register.validation.certificate_required_error"
                                      )}
                                    </p>
                                  )}
                                  {beError && (
                                    <p className="mt-1 text-xs text-red-600 flex items-center">
                                      <X className="w-3 h-3 mr-1 flex-shrink-0" />
                                      {beError}
                                    </p>
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
              {/* Experience Skills Section (Kết thúc ở đây) */}

              {/* Terms and Submit Section */}
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
                        onChange={(e) =>
                          updateFormData("agreeToTerms", e.target.checked)
                        }
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
                          updateFormData(
                            "agreeToBackgroundCheck",
                            e.target.checked
                          )
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1 flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700">
                        {t("technician_register.terms.agree_background_check")}
                      </span>
                    </div>
                    {validationErrors.agreeToBackgroundCheck && (
                      <div className="ml-7">
                        <ErrorMessage
                          error={validationErrors.agreeToBackgroundCheck}
                        />
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
            </div>
          </div>
        </div>
      </div>
      {/* Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div
            className="relative max-w-6xl w-full max-h-[90vh] bg-white rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-800">
                {previewImage.name}
              </h3>
              <button
                onClick={closePreview}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)] w-full">
              {previewImage.name.toLowerCase().endsWith(".pdf") ? (
                <embed
                  src={previewImage.url}
                  type="application/pdf"
                  width="100%"
                  height="800px"
                  style={{ minHeight: "600px" }}
                />
              ) : (
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
export default React.memo(TechnicianRegister);
