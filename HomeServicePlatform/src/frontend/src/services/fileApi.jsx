import axiosClient from "../config/axiosClient";

// --- ENDPOINTS FILE API ---
const fileEndpoints = {
  // Loại bỏ tiền tố /api
  upload: "/file/upload",
  get: "/File/{objectTypeName}/{objectId}/{relationType}", 
};

/**
 * Tải lên một tệp.
 * @param {object} params - Các tham số query.
 * @param {string} params.userId - Id người dùng. (Required, query)
 * @param {string} params.objectId - Id đối tượng liên quan (VD: Id Booking, Id Home). (Required, query)
 * @param {string} params.objectTypeName - Tên loại đối tượng (VD: 'Booking', 'Home'). (Required, query)
 * @param {string} [params.relationType] - Loại quan hệ (VD: 'ProfilePicture', 'Attachment'). (Optional, query)
 * @param {File} file - Đối tượng File (từ input type="file"). (Required, Request body: multipart/form-data)
 * @returns {Promise<axios.Response>}
 */
// fileApi.jsx

export const uploadFile = async (params, file) => {
  // 1. Chuẩn bị FormData cho file (Request body)
  const formData = new FormData();
  formData.append("File", file); // Tên key phải là "File" như trong Swagger

  // 2. Chuẩn bị tham số Query (Truyền trên URL)
  const { objectId, objectTypeName, relationType } = params;

  // Tạo Query String (ĐÚNG THEO SWAGGER)
  const queryParams = new URLSearchParams({
    
    objectId,
    objectTypeName,
    ...(relationType && { relationType }), 
  }).toString();

  // URL có query string (ĐÚNG THEO SWAGGER)
  const url = `${fileEndpoints.upload}?${queryParams}`; 

  try {
    const response = await axiosClient.post(url, formData);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi tải lên file:", error);
    throw error;
  }
};

/**
 * Lấy thông tin về tệp đã được đính kèm.
 * @param {object} params - Các tham số Path. (Required, path)
 * @param {string} params.objectTypeName - Tên loại đối tượng.
 * @param {string} params.objectId - Id đối tượng liên quan.
 * @param {string} params.relationType - Loại quan hệ.
 * @returns {Promise<axios.Response>}
 */
export const getFileMetadata = async ({
  objectTypeName,
  objectId,
  relationType,
}) => {
  // Thay thế các placeholder Path
  const url = fileEndpoints.get
    .replace("{objectTypeName}", objectTypeName)
    .replace("{objectId}", objectId)
    .replace("{relationType}", relationType);

  try {
    const response = await axiosClient.get(url);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin file:", error);
    throw error;
  }
};