// File: src/components/TechnicianDetails.jsx

import { Award, Briefcase, FileText } from "lucide-react";

// ĐÃ BỎ t ra khỏi props
const TechnicianDetails = ({ profile, getFileUrl }) => {
    
  if (!profile) return null;

  // Lấy dữ liệu chứng chỉ, đảm bảo là mảng
  const certifications = profile.certificateFiles || []; 
  // Lấy dữ liệu tài liệu pháp lý, đảm bảo là mảng
  const legalDocuments = profile.legalDocument || []; 
  // Lấy dữ liệu dịch vụ, đảm bảo là mảng
  const services = profile.services || [];

  return (
    // ĐÃ BỎ border-t, pt-6, mt-6 để căn chỉnh đúng trong Profile.jsx
    <div className="space-y-6"> 
      
      {/* ĐÃ BỎ TIÊU ĐỀ H3 (ui.technician_professional_info) */}
      
      <div className="space-y-6"> 
        
        {/* Số năm kinh nghiệm */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Briefcase className="w-4 h-4 text-blue-500" /> Số năm kinh nghiệm
          </label>
          {/* Đã bỏ t("ui.years") */}
          <p className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-semibold">
            {profile.experienceYears || 0} năm 
          </p>
        </div>
        
        {/* Danh sách Dịch vụ cung cấp */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Award className="w-4 h-4 text-blue-500" /> Dịch vụ cung cấp
          </label>
          <div className="flex flex-wrap gap-2">
            {services.length > 0 ? (
              services.map((service) => (
                <span key={service.id} className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {service.name}
                </span>
              ))
            ) : (
              <p className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                Chưa có dịch vụ nào được liệt kê.
              </p>
            )}
          </div>
        </div>

        {/* Danh sách Chứng chỉ */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Award className="w-4 h-4 text-blue-500" /> Chứng chỉ đã đính kèm
          </label>
          <div className="space-y-3">
            {certifications.length > 0 ? (
              certifications.map((cert) => (
                <a 
                  key={cert.id} 
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
                Không có chứng chỉ nào được đính kèm.
              </p>
            )}
          </div>
        </div>
        
        {/* Danh sách Tài liệu Pháp lý */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 text-blue-500" /> Tài liệu Pháp lý
          </label>
          <div className="space-y-3">
            {legalDocuments.length > 0 ? (
              legalDocuments.map((doc) => (
                <a 
                  key={doc.id} 
                  href={getFileUrl(doc.filePath)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-800 hover:bg-indigo-100 transition duration-200"
                >
                  <FileText className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium truncate">{doc.fileName}</span>
                </a>
              ))
            ) : (
              <p className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                Không có tài liệu pháp lý nào được đính kèm.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TechnicianDetails;