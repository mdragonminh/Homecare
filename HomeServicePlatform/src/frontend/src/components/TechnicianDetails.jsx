// src/components/TechnicianDetails.jsx
import {
  Award,
  Briefcase,
  CreditCard,
  FileText,
  Eye,
  MapPin,
  Edit3,
  Save,
  X,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import axiosClient from "../config/axiosClient";
import { serviceApi } from "../services/serviceApi";
import { toast } from "sonner";

// FilePreviewModal giữ nguyên 100%
const FilePreviewModal = ({ isOpen, onClose, fileUrl, fileName }) => {
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);

  if (!isOpen) return null;

  const isImage = /\.(jpe?g|png|gif|webp)$/i.test(fileName);
  const isPDF = /\.pdf$/i.test(fileName);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotate((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotate(0);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div className="absolute inset-0 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-gray-800 text-white px-5 py-3">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5" />
            <span className="text-sm font-medium truncate max-w-md">{fileName}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          {isImage ? (
            <div className="flex justify-center items-center h-full">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain"
                style={{ transform: `scale(${scale}) rotate(${rotate}deg)`, transition: "transform 0.3s ease" }}
              />
            </div>
          ) : isPDF ? (
            <iframe src={fileUrl} className="w-full h-full min-h-96 border-0" title={fileName} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FileText className="w-20 h-20 mb-4 text-gray-300" />
              <p className="text-lg">Không thể xem trước định dạng này</p>
            </div>
          )}
        </div>

        {isImage && (
          <div className="flex items-center justify-center gap-6 bg-gray-800 text-white px-5 py-3">
            <button onClick={handleZoomOut} className="p-2 hover:bg-gray-700 rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
            <button onClick={handleZoomIn} className="p-2 hover:bg-gray-700 rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button onClick={handleRotate} className="p-2 hover:bg-gray-700 rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m10 10v-5h-5m-10 5l5-5m10-10l-5 5" />
              </svg>
            </button>
            <button onClick={handleReset} className="px-4 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded">
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Mock data cho địa chỉ
const CITIES = ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Cần Thơ", "Hải Phòng"];

const TechnicianDetails = ({ profile, getFileUrl, onUpdateSuccess }) => {
  const [previewFile, setPreviewFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [allServices, setAllServices] = useState([]);

  // Form state - Giữ file cũ khi edit
  const [form, setForm] = useState({
    citizenId: "",
    address: "",
    experienceYears: 0,
    selectedServiceIds: [],
    legalDocumentFile: null, // Single file: object or null
    certificateFiles: [], // Multiple: array of objects
  });

  const [errors, setErrors] = useState({});

  // Sync form với profile, giữ file cũ
  useEffect(() => {
    if (profile) {
      setForm({
        citizenId: profile.citizenId || "",
        address: profile.address || "",
        experienceYears: profile.experienceYears || 0,
        selectedServiceIds: (profile.services || []).map((s) => s.id),
        legalDocumentFile: profile.legalDocument?.[0] || null, // Giữ file cũ nếu có (giả sử legalDocument là array)
        certificateFiles: profile.certificateFiles || [], // Giữ list file cũ
      });
    }
  }, [profile]);

  const fetchServices = useCallback(async () => {
    setLoadingServices(true);
    try {
      const res = await serviceApi.getServices();
      if (res.success) setAllServices(res.data || []);
      else toast.error("Không tải được danh sách dịch vụ");
    } catch {
      toast.error("Lỗi kết nối khi tải dịch vụ");
    } finally {
      setLoadingServices(false);
    }
  }, []);

  const handleEdit = () => {
    fetchServices();
    setIsEditing(true);
    setErrors({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    // Reset về profile gốc, giữ file cũ
    if (profile) {
      setForm({
        citizenId: profile.citizenId || "",
        address: profile.address || "",
        experienceYears: profile.experienceYears || 0,
        selectedServiceIds: (profile.services || []).map((s) => s.id),
        legalDocumentFile: profile.legalDocument?.[0] || null,
        certificateFiles: profile.certificateFiles || [],
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.citizenId.trim()) newErrors.citizenId = "Số CCCD không được để trống";
    else if (!/^\d{12}$/.test(form.citizenId)) newErrors.citizenId = "CCCD phải có 12 chữ số";

    if (!form.address.trim()) newErrors.address = "Địa chỉ không được để trống";

    if (form.experienceYears < 0) newErrors.experienceYears = "Số năm kinh nghiệm không âm";

    if (form.selectedServiceIds.length === 0) newErrors.services = "Chọn ít nhất 1 dịch vụ";

    if (!form.legalDocumentFile) newErrors.legalDocumentFile = "Phải tải lên tài liệu pháp lý";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleSave = async () => {
  if (!validate()) return;

  const jwtToken = localStorage.getItem("jwtToken");
  if (!jwtToken) {
    toast.error("Phiên đăng nhập hết hạn");
    return;
  }

  try {
    const formData = new FormData();
    
    formData.append("CitizenId", form.citizenId);
    formData.append("Address", form.address);
    formData.append("ExperienceYears", form.experienceYears.toString());
    
    // ✅ DEBUG: Kiểm tra Services trước khi gửi
    console.log("Selected Service IDs:", form.selectedServiceIds);
    form.selectedServiceIds.forEach((id) => {
      console.log("Appending service:", id);
      formData.append("Services", id);
    });

    // ✅ DEBUG: Xem toàn bộ FormData
    console.log("=== FormData Contents ===");
    for (let [key, value] of formData.entries()) {
      console.log(key, ":", value);
    }

    // LegalDocument
    if (form.legalDocumentFile) {
      let legalFile = form.legalDocumentFile instanceof File
        ? form.legalDocumentFile
        : await fetch(getFileUrl(form.legalDocumentFile.filePath))
            .then(r => r.blob())
            .then(blob => new File([blob], form.legalDocumentFile.fileName, { type: blob.type }));
      formData.append("LegalDocument", legalFile);
    }

    // Certificates
    for (const file of form.certificateFiles) {
      let certFile = file instanceof File
        ? file
        : await fetch(getFileUrl(file.filePath))
            .then(r => r.blob())
            .then(blob => new File([blob], file.fileName, { type: blob.type }));
      formData.append("Certificates", certFile);
    }

    await axiosClient.put(`/TechnicianManagement`, formData, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    toast.success("Cập nhật thông tin kỹ thuật viên thành công!");
    setIsEditing(false);
    onUpdateSuccess?.();
  } catch (err) {
    console.error("Full error:", err);
    console.error("Response data:", err.response?.data);
    toast.error(err.response?.data?.message || "Cập nhật thất bại");
  }
};  const handlePreview = (file) => {
    const url = file.filePath ? getFileUrl(file.filePath) : URL.createObjectURL(file);
    setPreviewFile({ url, name: file.fileName || file.name });
  };

  // Xóa file certificate
  const handleDeleteCertificate = (index) => {
    const newFiles = form.certificateFiles.filter((_, i) => i !== index);
    setForm({ ...form, certificateFiles: newFiles });
  };

  // Thay thế legal document
  const handleLegalFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, legalDocumentFile: file });
    }
  };

  // Thêm certificate files
  const handleCertificateFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setForm({ ...form, certificateFiles: [...form.certificateFiles, ...newFiles] });
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Nút Edit */}
      <div className="flex justify-end">
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <Edit3 className="w-4 h-4" />
            Chỉnh sửa thông tin kỹ thuật viên
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              <X className="w-4 h-4" />
              Hủy
            </button>
          </div>
        )}
      </div>

      {/* 3 ô thông tin */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col space-y-1 p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
            <Briefcase className="w-4 h-4 text-blue-500" /> SỐ NĂM KINH NGHIỆM
          </label>
          {isEditing ? (
            <input
              type="number"
              min="0"
              value={form.experienceYears}
              onChange={(e) => setForm({ ...form, experienceYears: +e.target.value || 0 })}
              className={`w-full px-3 py-2 border rounded-lg ${errors.experienceYears ? "border-red-500" : "border-gray-300"}`}
            />
          ) : (
            <p className="text-gray-900 font-medium text-lg">{`${profile.experienceYears || 0} năm`}</p>
          )}
          {errors.experienceYears && <p className="text-red-600 text-xs mt-1">{errors.experienceYears}</p>}
        </div>

        <div className="flex flex-col space-y-1 p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
            <CreditCard className="w-4 h-4 text-blue-500" /> SỐ CCCD
          </label>
          {isEditing ? (
            <input
              type="text"
              value={form.citizenId}
              onChange={(e) => setForm({ ...form, citizenId: e.target.value.replace(/\D/g, '').slice(0, 12) })}
              className={`w-full px-3 py-2 border rounded-lg ${errors.citizenId ? "border-red-500" : "border-gray-300"}`}
              placeholder="12 chữ số"
            />
          ) : (
            <p className="text-gray-900 font-medium text-lg truncate">{profile.citizenId || "Chưa cập nhật"}</p>
          )}
          {errors.citizenId && <p className="text-red-600 text-xs mt-1">{errors.citizenId}</p>}
        </div>

        <div className="flex flex-col space-y-1 p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
            <MapPin className="w-4 h-4 text-blue-500" /> ĐỊA CHỈ
          </label>
          {isEditing ? (
            <select
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${errors.address ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="">-- Chọn thành phố --</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-gray-900 font-medium text-lg truncate">{profile.address || "Chưa cập nhật"}</p>
          )}
          {errors.address && <p className="text-red-600 text-xs mt-1">{errors.address}</p>}
        </div>
      </div>

      {/* Dịch vụ cung cấp - Làm đẹp hơn với grid layout và hover effects */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Award className="w-4 h-4 text-blue-500" /> Dịch vụ cung cấp
        </label>
        {isEditing ? (
          <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
            {loadingServices ? (
              <p className="text-sm text-gray-500">Đang tải dịch vụ...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-48 overflow-y-auto">
                {allServices.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-blue-50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={form.selectedServiceIds.includes(s.id)}
                      onChange={(e) => {
                        const newIds = e.target.checked
                          ? [...form.selectedServiceIds, s.id]
                          : form.selectedServiceIds.filter((id) => id !== s.id);
                        setForm({ ...form, selectedServiceIds: newIds });
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-800">{s.name}</span>
                  </label>
                ))}
              </div>
            )}
            {errors.services && <p className="text-red-600 text-sm mt-2">{errors.services}</p>}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
            {profile.services?.length > 0 ? profile.services.map((s) => (
              <span key={s.id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">{s.name}</span>
            )) : <p className="text-sm text-yellow-800">Chưa có dịch vụ nào.</p>}
          </div>
        )}
      </div>

      {/* Chứng chỉ - Multiple files với xóa */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Award className="w-4 h-4 text-blue-500" /> Chứng chỉ đã đính kèm
        </label>
        <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
          {isEditing ? (
            <div>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleCertificateFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4"
              />
              <div className="space-y-2">
                {form.certificateFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white border rounded-lg">
                    <span className="text-sm truncate">{file.fileName || file.name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => handlePreview(file)} className="text-blue-600 hover:text-blue-800">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteCertificate(index)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {profile.certificateFiles?.length > 0 ? profile.certificateFiles.map((cert) => (
                <button
                  key={cert.id}
                  onClick={() => handlePreview(cert)}
                  className="w-full flex items-center justify-between p-2 bg-white border rounded-lg hover:bg-green-50"
                >
                  <span className="text-sm truncate">{cert.fileName}</span>
                  <Eye className="w-4 h-4 text-gray-600" />
                </button>
              )) : <p className="text-sm text-yellow-800">Không có chứng chỉ.</p>}
            </div>
          )}
        </div>
      </div>

      {/* Tài liệu pháp lý - Single file với thay thế */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <FileText className="w-4 h-4 text-blue-500" /> Tài liệu pháp lý
        </label>
        <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
          {isEditing ? (
            <div>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleLegalFileChange}
                className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 ${
                  errors.legalDocumentFile ? "file:bg-red-50 file:text-red-700" : "file:bg-blue-50 file:text-blue-700"
                } hover:file:bg-blue-100 mb-4`}
              />
              {form.legalDocumentFile && (
                <div className="flex items-center justify-between p-2 bg-white border rounded-lg">
                  <span className="text-sm truncate">{form.legalDocumentFile.fileName || form.legalDocumentFile.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handlePreview(form.legalDocumentFile)} className="text-blue-600 hover:text-blue-800">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => setForm({ ...form, legalDocumentFile: null })} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              {errors.legalDocumentFile && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.legalDocumentFile}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {profile.legalDocument?.length > 0 ? profile.legalDocument.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handlePreview(doc)}
                  className="w-full flex items-center justify-between p-2 bg-white border rounded-lg hover:bg-indigo-50"
                >
                  <span className="text-sm truncate">{doc.fileName}</span>
                  <Eye className="w-4 h-4 text-gray-600" />
                </button>
              )) : <p className="text-sm text-yellow-800">Không có tài liệu pháp lý.</p>}
            </div>
          )}
        </div>
      </div>

      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url}
        fileName={previewFile?.name}
      />
    </div>
  );
};

export default TechnicianDetails;