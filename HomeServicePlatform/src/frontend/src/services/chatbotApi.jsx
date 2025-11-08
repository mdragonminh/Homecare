import axiosClient from "../config/axiosClient";

/**
 * Gửi tin nhắn đến chatbot và nhận phản hồi.
 * @param {object} chatData - Dữ liệu chat
 * @param {string} chatData.message - Nội dung tin nhắn.
 * @param {string|null} chatData.conversationId - ID của cuộc hội thoại (nếu có).
 * @returns {Promise<object>} - Trả về { response, conversationId }
 */
const postMessage = async (chatData) => {
  const response = await axiosClient.post("/chatbot/chat", chatData);
  return response.data; // Trả về { response, conversationId }
};

export const chatbotApi = {
  postMessage,
};