// File: src/components/TechnicianDetails.jsx

import { Award, Briefcase, FileText } from "lucide-react";

const TechnicianDetails = ({ profile, t, getFileUrl }) => {
    
  if (!profile) return null;

  // Lấy dữ liệu chứng chỉ, đảm bảo là mảng
  const certifications = profile.certificateFiles || []; 

  return (
    // Sử dụng mt-6 để tạo khoảng cách với phần thông tin chung
    <div className="bg-white rounded-lg shadow-sm border border-blue-100 mt-6"> 
      
      <div className="border-b border-gray-200 px-6 py-4 bg-blue-50 rounded-t-lg">
        <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-600" />
          {t("ui.technician_professional_info") || "Thông tin Chuyên môn"}
        </h3>
      </div>
      
      <div className="p-6 space-y-6">
        
        {/* Số năm kinh nghiệm */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Briefcase className="w-4 h-4 text-blue-500" /> {t("ui.experience_years") || "Số năm kinh nghiệm"}
          </label>
          <p className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-semibold">
            {profile.experienceYears || 0} {t("ui.years") || "năm"}
          </p>
        </div>

        {/* Danh sách Chứng chỉ */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Award className="w-4 h-4 text-blue-500" /> {t("ui.certificates") || "Chứng chỉ đã đính kèm"}
          </label>
          <div className="space-y-3">
            {certifications.length > 0 ? (
              certifications.map((cert) => (
                <a 
                  key={cert.id} 
                  // getFileUrl là hàm helper được truyền từ TechnicianProfile.jsx (sử dụng logic của getAvatarUrl)
                  href={getFileUrl(cert.filePath)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-800 hover:bg-green-100 transition duration-200"
                >
                  <FileText className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium truncate">{cert.fileName}</span>
                </a>
              ))
            ) : (
              <p className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                {t("ui.no_certificates_found") || "Chưa có chứng chỉ nào được tải lên."}
              </p>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default TechnicianDetails;