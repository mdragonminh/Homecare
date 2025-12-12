import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG === "true";

let isRefreshing = false;
let failedQueue = [];
let refreshTokenPromise = null;

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
axiosClient.interceptors.request.use(
  (config) => {
    const lang = localStorage.getItem("appLang") || "vi-VN";
    config.headers["Accept-Language"] = lang;
    
    const token = localStorage.getItem("jwtToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    
    if (ENABLE_DEBUG) {
      console.groupCollapsed(`[Axios] Request → ${config.url}`);
      console.log("Language:", lang);
      console.log("Token:", token ? "✓ Attached" : "✗ None");
      console.log("Config:", config);
      console.groupEnd();
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosClient.interceptors.response.use(
  (response) => {
    if (ENABLE_DEBUG) {
      console.groupCollapsed(`[Axios] Response ✓ ${response.config.url}`);
      console.log("Status:", response.status);
      console.log("Data:", response.data);
      console.groupEnd();
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    
    if (ENABLE_DEBUG) {
      console.groupCollapsed(
        `%c[Axios] Response ✗ ${originalRequest?.url}`,
        "color: red"
      );
      console.log("Status:", status || "Unknown");
      console.log("Message:", error.message);
      console.log("Data:", error.response?.data);
      console.groupEnd();
    }

    // Kiểm tra các điều kiện cần thiết
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isLoginEndpoint = originalRequest.url?.includes("/Authentication/login");
    const isRefreshEndpoint = originalRequest.url?.includes("/Authentication/refresh-token");

    // Xử lý 401 Unauthorized
    if (status === 401 && !isLoginEndpoint && !isRefreshEndpoint && !originalRequest._retry) {
      originalRequest._retry = true;

      // Nếu đang refresh, đưa request vào queue
      if (isRefreshing) {
        if (ENABLE_DEBUG) {
          console.log("[Axios] Token đang refresh, thêm vào queue...");
        }
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Bắt đầu refresh token
      isRefreshing = true;
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        if (ENABLE_DEBUG) {
          console.error("[Axios] Không tìm thấy refresh token");
        }
        isRefreshing = false;
        processQueue(error, null);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      // Tạo promise duy nhất cho việc refresh
      if (!refreshTokenPromise) {
        refreshTokenPromise = axios.post(
          `${API_URL}/Authentication/refresh-token`,
          { refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
              "Accept-Language": localStorage.getItem("appLang") || "vi-VN",
            },
          }
        );
      }

      try {
        if (ENABLE_DEBUG) {
          console.log("[Axios] Đang refresh token...");
        }

        const response = await refreshTokenPromise;
        const { jwtToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        if (!newAccessToken || !newRefreshToken) {
          throw new Error("Invalid token response format");
        }

        if (ENABLE_DEBUG) {
          console.log("[Axios] Refresh token thành công ✓");
        }

        // Lưu token mới
        localStorage.setItem("jwtToken", newAccessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        // Xử lý các request đang chờ
        processQueue(null, newAccessToken);

        // Retry request gốc
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);

      } catch (refreshError) {
        if (ENABLE_DEBUG) {
          console.error("[Axios] Refresh token thất bại:", refreshError.response?.data || refreshError.message);
        }

        // Xử lý thất bại
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
        refreshTokenPromise = null;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;