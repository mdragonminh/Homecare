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
  Edit,
} from "lucide-react";
import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import axiosClient from "../config/axiosClient";
import { serviceApi } from "../services/serviceApi";
import { toast } from "sonner";
const CITIES = ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Cần Thơ", "Hải Phòng"];

// ----------------------------------------------------
// Component con: FilePreviewModal (Giữ nguyên)
// ----------------------------------------------------
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
      className="fixed inset-0 z-50 flex justify-center items-start pt-4 pb-4 md:items-center md:pt-0 md:pb-0 bg-black/40"
      onClick={onClose}
    >
      <div className="absolute inset-0 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-full md:max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-gray-800 text-white px-5 py-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium truncate max-w-full">{fileName}</span>
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
// eslint-disable-next-line no-unused-vars
const SimpleFieldEditor = ({ label, icon: Icon, value, fieldName, error, children, isFieldEditing, handleEditField }) => {
    return (
      <div className="flex flex-col space-y-1 p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition relative">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
          <Icon className="w-4 h-4 text-blue-500" /> {label}
        </label>
        
        {isFieldEditing ? (
          <>
            <div className="pt-1">{children}</div>
            {error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <p className="text-xs text-red-700 font-medium">{error}</p>
                </div>
            )}
          </>
        ) : (
          <div
            className="flex items-center justify-between py-1 cursor-pointer group"
            onClick={() => handleEditField(fieldName)}
          >
            <p className="text-gray-900 font-medium text-lg truncate group-hover:text-blue-600 transition">
              {value}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditField(fieldName);
              }}
              className="text-blue-600 hover:text-blue-700 p-1"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
};
// eslint-disable-next-line no-unused-vars
const ComplexSectionEditor = ({ label, icon: Icon, fieldName, error, children, viewContent, isFieldEditing, handleEditField }) => {
    return (
      <div>
        <div className="flex items-center justify-between pb-2 mb-2"> 
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Icon className="w-4 h-4 text-blue-500" /> {label}
          </label>
          {!isFieldEditing && (
            <button 
              onClick={() => handleEditField(fieldName)} 
              className="text-blue-500 hover:text-blue-700 transition p-1"
              title="Chỉnh sửa phần này"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {isFieldEditing ? (
          <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
            {children}
            {error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <p className="text-xs text-red-700 font-medium">{error}</p>
                </div>
            )}
          </div>
        ) : (
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            {viewContent}
          </div>
        )}
      </div>
    );
};
const TechnicianDetails = forwardRef(({ profile, getFileUrl, onUpdateSuccess ,setIsDetailsEditing}, ref) => {
  const [previewFile, setPreviewFile] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [loadingServices, setLoadingServices] = useState(false);
  const [allServices, setAllServices] = useState([]);

  const [form, setForm] = useState({
    citizenId: "",
    address: "",
    experienceYears: 0,
    selectedServiceIds: [],
    legalDocumentFile: null, 
    certificateFiles: [],
  });

  const [errors, setErrors] = useState({});
  const [originalForm, setOriginalForm] = useState(null);
useImperativeHandle(ref, () => ({
    handleDetailsSave: handleSave, 
    handleDetailsCancel: handleCancel, 
    isEditing: !!editingField, 
    isFormValid: validate,
  }));
  const clearError = useCallback((fieldName) => {
    setErrors((prevErrors) => {
      if (!prevErrors[fieldName]) return prevErrors;
      const newErrors = { ...prevErrors };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  useEffect(() => {
    if (profile) {
        const initialForm = {
            citizenId: profile.citizenId || "",
            address: profile.address || "",
            experienceYears: profile.experienceYears || 0,
            selectedServiceIds: (profile.services || []).map((s) => s.id),
            legalDocumentFile: profile.legalDocument?.[0] || null,
            certificateFiles: profile.certificateFiles || [],
        };
        setForm(initialForm);
        setOriginalForm(initialForm);
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

 const handleEditField = useCallback((fieldName) => {
    if (fieldName === 'services') {
      fetchServices();
    }
    setEditingField(fieldName); 
    setIsDetailsEditing(true);
    setErrors({});
  }, [fetchServices]); 

  const handleCancel = useCallback(() => {
    if (originalForm) {
        setForm(originalForm);
    }
    setEditingField(null);
    setIsDetailsEditing(false);
    setErrors({});
  }, [originalForm, setIsDetailsEditing]);

  const validate = useCallback(() => {
    const newErrors = {};

    if (!form.citizenId.trim()) newErrors.citizenId = "Số CCCD không được để trống";
    else if (!/^\d{12}$/.test(form.citizenId)) newErrors.citizenId = "CCCD phải có 12 chữ số";

    if (!form.address.trim()) newErrors.address = "Địa chỉ không được để trống";

    if (form.experienceYears < 0) newErrors.experienceYears = "Số năm kinh nghiệm không âm";

    if (form.selectedServiceIds.length === 0) newErrors.services = "Chọn ít nhất 1 dịch vụ";

    if (!form.legalDocumentFile) newErrors.legalDocumentFile = "Phải tải lên tài liệu pháp lý";

    setErrors(newErrors);
    
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Vui lòng kiểm tra các trường bị lỗi");
      return;
    }

    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      toast.error("Phiên đăng nhập hết hạn");
      return;
    }

    try {
      const formData = new FormData();
      if (form.legalDocumentFile) {
        let legalFile = form.legalDocumentFile instanceof File
          ? form.legalDocumentFile
          : await fetch(getFileUrl(form.legalDocumentFile.filePath))
              .then(r => r.blob())
              .then(blob => new File([blob], form.legalDocumentFile.fileName, { type: blob.type }));
        formData.append("LegalDocument", legalFile);
      } else {
          // LƯU Ý: Nếu legalDocumentFile là bắt buộc, bạn nên xử lý lỗi ở đây
          // hoặc dựa vào hàm validate đã có.
      }
      for (const file of form.certificateFiles) {
        let certFile = file instanceof File
          ? file
          : await fetch(getFileUrl(file.filePath))
              .then(r => r.blob())
              .then(blob => new File([blob], file.fileName, { type: blob.type }));
        formData.append("Certificates", certFile);
      }
      const urlSearchParams = new URLSearchParams({
          CitizenId: form.citizenId,
          Address: form.address,
          ExperienceYears: form.experienceYears.toString(),
      });
     form.selectedServiceIds.forEach((id, index) => {
    formData.append(`Services[${index}].Id`, id); 
});
      const finalUrl = `/TechnicianManagement?${urlSearchParams.toString()}`;
      await axiosClient.put(finalUrl, formData, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });
      setOriginalForm({...form});
      setEditingField(null);
      setIsDetailsEditing(false);
      onUpdateSuccess?.(); 
    } catch (err) {
      console.error("Full error:", err);
      console.error("Response data:", err.response?.data);
      toast.error(err.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const handlePreview = (file) => {
    const url = file.filePath ? getFileUrl(file.filePath) : URL.createObjectURL(file);
    setPreviewFile({ url, name: file.fileName || file.name });
  };

  const handleDeleteCertificate = useCallback((index) => {
    clearError('certificateFiles');
    const newFiles = form.certificateFiles.filter((_, i) => i !== index);
    setForm({ ...form, certificateFiles: newFiles });
  }, [form, clearError]);

  const handleLegalFileChange = useCallback((e) => {
    clearError('legalDocumentFile');
    const file = e.target.files[0];
    if (file) {
      setForm((prevForm) => ({ ...prevForm, legalDocumentFile: file }));
    }
  }, [clearError]);
  
  const handleCertificateFileChange = useCallback((e) => {
    clearError('certificateFiles');
    const newFiles = Array.from(e.target.files);
    setForm((prevForm) => ({ ...prevForm, certificateFiles: [...prevForm.certificateFiles, ...newFiles] }));
  }, [clearError]);
  
  const handleDeleteLegalDocument = useCallback(() => {
    clearError('legalDocumentFile');
    setForm((prevForm) => ({ ...prevForm, legalDocumentFile: null }));
  }, [clearError]);

  if (!profile) return null;


  return (
    <div className="space-y-6">

      {/* 3 ô thông tin đơn lẻ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Số năm kinh nghiệm */}
        <SimpleFieldEditor
            label="SỐ NĂM KINH NGHIỆM"
            icon={Briefcase}
            fieldName="experience"
            value={`${form.experienceYears || 0} năm`}
            error={errors.experienceYears}
            isFieldEditing={editingField === 'experience'}
            handleEditField={handleEditField}
        >
            <input
              type="number"
              min="0"
              value={form.experienceYears}
              onChange={(e) => {
                clearError('experienceYears');
                setForm({ ...form, experienceYears: +e.target.value || 0 })
              }}
              className={`w-full px-3 py-2 border rounded-lg ${errors.experienceYears ? "border-red-500" : "border-gray-300"}`}
            />
        </SimpleFieldEditor>

        {/* Số CCCD */}
        <SimpleFieldEditor
            label="SỐ CCCD"
            icon={CreditCard}
            fieldName="citizenId"
            value={form.citizenId || "Chưa cập nhật"}
            error={errors.citizenId}
            isFieldEditing={editingField === 'citizenId'}
            handleEditField={handleEditField}
        >
            <input
              type="text"
              value={form.citizenId}
              onChange={(e) => {
                clearError('citizenId');
                setForm({ ...form, citizenId: e.target.value.replace(/\D/g, '').slice(0, 12) })
              }}
              className={`w-full px-3 py-2 border rounded-lg ${errors.citizenId ? "border-red-500" : "border-gray-300"}`}
              placeholder="12 chữ số"
            />
        </SimpleFieldEditor>

        {/* Địa chỉ */}
        <SimpleFieldEditor
            label="ĐỊA CHỈ"
            icon={MapPin}
            fieldName="address"
            value={form.address || "Chưa cập nhật"}
            error={errors.address}
            isFieldEditing={editingField === 'address'}
            handleEditField={handleEditField}
        >
            <select
              value={form.address}
              onChange={(e) => {
                clearError('address');
                setForm({ ...form, address: e.target.value })
              }}
              className={`w-full px-3 py-2 border rounded-lg ${errors.address ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="">-- Chọn thành phố --</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
        </SimpleFieldEditor>
      </div>

      {/* Dịch vụ cung cấp */}
      <ComplexSectionEditor
        label="Dịch vụ cung cấp"
        icon={Award}
        fieldName="services"
        error={errors.services}
        isFieldEditing={editingField === 'services'}
        handleEditField={handleEditField}
        viewContent={
          <div className="flex flex-wrap gap-2">
           {form.selectedServiceIds.length > 0 ? (
                form.selectedServiceIds.map((id) => {
                    // Tìm đối tượng dịch vụ (cần tìm trong profile hoặc allServices)
                    const service = profile.services?.find(s => s.id === id) || allServices.find(s => s.id === id);
                    
                    return service ? (
                        <span key={id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {service.name}
                        </span>
                    ) : null;
                })
            ) : (
                <p className="text-sm text-yellow-800">Chưa có dịch vụ nào.</p>
            )}
          </div>
        }
      >
        {/* Children content (Edit mode) */}
        <div>
          {loadingServices ? (
            <p className="text-sm text-gray-500">Đang tải dịch vụ...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-48 overflow-y-auto">
              {allServices.map((s) => (
                <label key={s.id} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-blue-50 cursor-pointer transition bg-gray-50">
                  <input
                    type="checkbox"
                    checked={form.selectedServiceIds.includes(s.id)}
                    onChange={(e) => {
                      clearError('services');
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
        </div>
      </ComplexSectionEditor>

      {/* Chứng chỉ - Multiple files với xóa */}
      <ComplexSectionEditor
        label="Chứng chỉ đã đính kèm"
        icon={Award}
        fieldName="certificates"
        error={errors.certificateFiles}
        isFieldEditing={editingField === 'certificates'}
        handleEditField={handleEditField}
        viewContent={
          <div className="space-y-2">
            {profile.certificateFiles?.length > 0 ? profile.certificateFiles.map((cert) => (
              <button
                key={cert.id}
                onClick={() => handlePreview(cert)}
                // ✅ Sửa viền cho Chế độ Xem (View Mode) Chứng chỉ
                className="w-full flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg hover:bg-green-50"
              >
                <span className="text-sm truncate">{cert.fileName}</span>
                <Eye className="w-4 h-4 text-gray-600" />
              </button>
            )) : <p className="text-sm text-yellow-800">Không có chứng chỉ.</p>}
          </div>
        }
      >
        {/* Children content (Edit mode) */}
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
              <div key={index} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg">
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
      </ComplexSectionEditor>

      {/* Tài liệu pháp lý - Single file với thay thế */}
      <ComplexSectionEditor
        label="Tài liệu pháp lý"
        icon={FileText}
        fieldName="legalDocument"
        error={errors.legalDocumentFile}
        isFieldEditing={editingField === 'legalDocument'}
        handleEditField={handleEditField}
        viewContent={
          <div className="space-y-2">
            {profile.legalDocument?.length > 0 ? profile.legalDocument.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handlePreview(doc)}
                className="w-full flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg hover:bg-indigo-50"
              >
                <span className="text-sm truncate">{doc.fileName}</span>
                <Eye className="w-4 h-4 text-gray-600" />
              </button>
            )) : <p className="text-sm text-yellow-800">Không có tài liệu pháp lý.</p>}
          </div>
        }
      >
        {/* Children content (Edit mode) */}
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
            <div className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg">
              <span className="text-sm truncate">{form.legalDocumentFile.fileName || form.legalDocumentFile.name}</span>
              <div className="flex gap-2">
                <button onClick={() => handlePreview(form.legalDocumentFile)} className="text-blue-600 hover:text-blue-800">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={handleDeleteLegalDocument} className="text-red-600 hover:text-red-800">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </ComplexSectionEditor>


      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url}
        fileName={previewFile?.name}
      />
    </div>
  );
});

export default TechnicianDetails;