import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG === "true";
let isRefreshing = false;
let failedQueue = [];

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
// ---------------------------------------------

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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
      console.groupCollapsed(
        `[Axios Interceptor] Gửi Request đến: ${config.url}`
      );
      console.log("Ngôn ngữ (Accept-Language):", lang);
      console.log("Token (Authorization):", token ? "Đã đính kèm" : "Không có");
      console.log("Full Config:", config);
      console.groupEnd();
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => {
    if (ENABLE_DEBUG) {
      console.groupCollapsed(
        `[Axios Interceptor] Response Thành Công từ: ${response.config.url}`
      );
      console.log("Status:", response.status);
      console.log("Data:", response.data);
      console.groupEnd();
    }
    return response;
  },
  async (error) => {
    if (ENABLE_DEBUG) {
      console.groupCollapsed(
        `%c[Axios Interceptor] Response Thất Bại từ: ${error.config.url}`,
        "color: red"
      );
      console.log("Status:", error.response?.status || "Không xác định");
      console.log("Error Message:", error.message);
      console.log("Response Data:", error.response?.data);
      console.groupEnd();
    }

    const originalRequest = error.config;
    const status = error.response?.status;
    if (
      status === 401 &&
      originalRequest.url !== "/Authentication/refresh-token" &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
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
      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        isRefreshing = false;
        processQueue(error, null);

        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${API_URL}/Authentication/refresh-token`,
          {
            refreshToken: refreshToken,
          }
        );

        isRefreshing = false;

        const { jwtToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data;
        localStorage.setItem("jwtToken", newAccessToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
export default axiosClient;
