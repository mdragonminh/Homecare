// src/utils/axiosClient.jsx

import axios from "axios";

// Lấy base URL từ biến môi trường
const API_URL = import.meta.env.VITE_API_URL;
// Lấy biến debug
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG === "true"; // Thêm dòng này nếu bạn có biến VITE_ENABLE_DEBUG

// Tạo một instance (thể hiện) của axios
const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Thiết lập Interceptor để tự động thêm Header Ngôn ngữ ---
// Interceptor này sẽ chạy trước khi mọi request được gửi đi
axiosClient.interceptors.request.use(
  (config) => {
    // 1. Lấy ngôn ngữ hiện tại được lưu trữ
    const lang = localStorage.getItem("appLang") || "vi-VN"; 

    // 2. Thêm Header Ngôn ngữ
    config.headers["Accept-Language"] = lang; 
    
    // 3. (TÙY CHỌN) Thêm Bearer Token nếu có
    const token = localStorage.getItem("jwtToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ⭐️ LOG XÁC NHẬN HEADER ĐÃ ĐƯỢC THÊM ⭐️
    if (ENABLE_DEBUG) {
      console.groupCollapsed(`[Axios Interceptor] Gửi Request đến: ${config.url}`);
      console.log("Ngôn ngữ (Accept-Language):", lang);
      console.log("Token (Authorization):", token ? "Đã đính kèm" : "Không có");
      console.log("Full Config:", config);
      console.groupEnd();
    }
    // ⭐️ KẾT THÚC LOG ⭐️
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- (TÙY CHỌN) Thêm Interceptor cho Response để kiểm tra thành công/thất bại ---
axiosClient.interceptors.response.use(
    (response) => {
        // Log khi request thành công (Status 2xx)
        if (ENABLE_DEBUG) {
            console.groupCollapsed(`[Axios Interceptor] Response Thành Công từ: ${response.config.url}`);
            console.log("Status:", response.status);
            console.log("Data:", response.data);
            console.groupEnd();
        }
        return response;
    },
    (error) => {
        // Log khi request thất bại (Status 4xx, 5xx)
        if (ENABLE_DEBUG) {
            console.groupCollapsed(`%c[Axios Interceptor] Response Thất Bại từ: ${error.config.url}`, 'color: red');
            console.log("Status:", error.response?.status || "Không xác định");
            console.log("Error Message:", error.message);
            console.log("Response Data:", error.response?.data);
            console.groupEnd();
        }
        return Promise.reject(error);
    }
);


export default axiosClient;