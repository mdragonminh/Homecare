import axiosClient from "../config/axiosClient";

export const ocrApi = {
  scanCitizenId: async (citizenIdImageFile) => {
    try {
      const formData = new FormData();
      formData.append("file", citizenIdImageFile);
      const res = await axiosClient.post("/Ocr/scan", formData);
      return {
        success: true,
        data: res.data,
      };
    } catch (error) {
      console.error("OCR Scan Error:", error);

      const responseData = error.response?.data;
      const serverMessage =
        responseData?.message || "Quét CCCD thất bại. Vui lòng thử lại.";

      return {
        success: false,
        message: serverMessage,
        data: responseData,
      };
    }
  },
};
