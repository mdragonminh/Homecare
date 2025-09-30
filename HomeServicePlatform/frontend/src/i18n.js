// src/i18n.js - ĐÃ ĐIỀU CHỈNH ĐỂ DÙNG THƯ MỤC SRC

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
// ❌ LOẠI BỎ: Không dùng HttpBackend khi file nằm trong src

// 💡 IMPORT TRỰC TIẾP TỪ SRC/LOCALES
// Webpack/Vite sẽ đảm bảo các file này được đóng gói (bundled)
import viTranslation from './locales/vn/translation.json';
import enTranslation from './locales/en/translation.json';



// 1. Định nghĩa các chuỗi dịch thuật (resources)
const resources = {
  // Key 'vi' phải khớp với key trong supportedLngs
  'vi': {
    translation: viTranslation,
  },
  'en': {
    translation: enTranslation,
  },
};

// Lấy ngôn ngữ hiện tại từ localStorage
const currentLang = localStorage.getItem("appLang") || "vi";

i18n
  // 1. Tự động dò ngôn ngữ người dùng
  .use(LanguageDetector)
  // 2. Kết nối i18next với React
  .use(initReactI18next)
  // 3. Khởi tạo
  .init({
    // ✅ THÊM LẠI: Truyền đối tượng resources đã import vào
    resources, 
    
    // Ngôn ngữ mặc định ban đầu
    lng: currentLang, 
    // Ngôn ngữ dự phòng
    fallbackLng: "vi", 

    // ❌ LOẠI BỎ: Không cần cấu hình backend nữa
    
    // Danh sách các ngôn ngữ được hỗ trợ
    supportedLngs: ['vi', 'en'],
    // Giữ nguyên cài đặt này
    nonExplicitSupportedLngs: true, 

    interpolation: {
      escapeValue: false,
    },
    defaultNS: 'translation', 
    
    // Cấu hình này giúp hiển thị nội dung ngay lập tức trong React
    react: {
        useSuspense: false, 
    },
    
    debug: false, 
  });

export default i18n;