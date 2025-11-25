
import {
  Award,
  Briefcase,
  CreditCard,
  FileText,
  Eye,
  MapPin,
} from "lucide-react";
import { useState } from "react";

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
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
      onClick={onClose}
    >
      <div className="absolute inset-0 backdrop-blur-sm" />

      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-gray-800 text-white px-5 py-3">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5" />
            <span className="text-sm font-medium truncate max-w-md">
              {fileName}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded transition"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Nội dung xem trước */}
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          {isImage ? (
            <div className="flex justify-center items-center h-full">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain"
                style={{
                  transform: `scale(${scale}) rotate(${rotate}deg)`,
                  transition: "transform 0.3s ease",
                }}
              />
            </div>
          ) : isPDF ? (
            <iframe
              src={fileUrl}
              className="w-full h-full min-h-96 border-0"
              title={fileName}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FileText className="w-20 h-20 mb-4 text-gray-300" />
              <p className="text-lg">Không thể xem trước định dạng này</p>
            </div>
          )}
        </div>

        {/* Thanh công cụ (chỉ ảnh) */}
        {isImage && (
          <div className="flex items-center justify-center gap-6 bg-gray-800 text-white px-5 py-3">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-700 rounded"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </button>
            <span className="text-sm font-medium">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-700 rounded"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
            <button
              onClick={handleRotate}
              className="p-2 hover:bg-gray-700 rounded"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h5m10 10v-5h-5m-10 5l5-5m10-10l-5 5"
                />
              </svg>
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const TechnicianDetails = ({ profile, getFileUrl }) => {
  const [previewFile, setPreviewFile] = useState(null);

  if (!profile) return null;

  const certifications = profile.certificateFiles || [];
  const legalDocuments = profile.legalDocument || [];
  const services = profile.services || [];

  const handlePreview = (file) => {
    const url = getFileUrl(file.filePath);
    setPreviewFile({ url, name: file.fileName || "Tài liệu" });
  };

  const DetailField = ({ label, value, icon: Icon /* eslint-disable-line no-unused-vars */ }) => (
    <div className="flex flex-col space-y-1 p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition">
      <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
        <Icon className="w-4 h-4 text-blue-500" /> {label}
      </label>
      <p className="text-gray-900 font-medium text-lg truncate">
        {value || "Chưa cập nhật"}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailField
          label="SỐ NĂM KINH NGHIỆM"
          value={`${profile.experienceYears || 0} năm`}
          icon={Briefcase}
        />
        <DetailField
          label="SỐ CCCD"
          value={profile.citizenId || "Chưa cập nhật"}
          icon={CreditCard}
        />
        <DetailField
          label="ĐỊA CHỈ"
          value={profile.address || "Chưa cập nhật"}
          icon={MapPin}
        />
      </div>

      {/* Dịch vụ cung cấp */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Award className="w-4 h-4 text-blue-500" /> Dịch vụ cung cấp
        </label>
        <div className="flex flex-wrap gap-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
          {services.length > 0 ? (
            services.map((s) => (
              <span
                key={s.id}
                className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
              >
                {s.name}
              </span>
            ))
          ) : (
            <p className="text-sm text-yellow-800">
              Chưa có dịch vụ nào được liệt kê.
            </p>
          )}
        </div>
      </div>

      {/* Chứng chỉ */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Award className="w-4 h-4 text-blue-500" /> Chứng chỉ đã đính kèm
        </label>
        <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
          {certifications.length > 0 ? (
            certifications.map((cert) => (
              <button
                key={cert.id}
                onClick={() => handlePreview(cert)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border border-green-200 rounded-lg hover:bg-green-50 transition group text-left"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-green-800 truncate">
                    {cert.fileName}
                  </span>
                </div>
                <Eye className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition" />
              </button>
            ))
          ) : (
            <p className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              Không có chứng chỉ nào được đính kèm.
            </p>
          )}
        </div>
      </div>
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <FileText className="w-4 h-4 text-blue-500" /> Tài liệu pháp lý
        </label>
        <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
          {legalDocuments.length > 0 ? (
            legalDocuments.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handlePreview(doc)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition group text-left"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-indigo-800 truncate">
                    {doc.fileName}
                  </span>
                </div>
                <Eye className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition" />
              </button>
            ))
          ) : (
            <p className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              Không có tài liệu pháp lý nào được đính kèm.
            </p>
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
