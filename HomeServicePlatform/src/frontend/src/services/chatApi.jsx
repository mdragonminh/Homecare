import axios from "axios";

const API_BASE_URL = "http://localhost:5093/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwtToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const chatApi = {
  // Create or get existing conversation between two users
  createOrGetConversation: async (customerId, technicianId, bookingId = null) => {
    try {
      const response = await api.post("/chat/conversations", {
        customerId,
        technicianId,
        bookingId,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all conversations for current user
  getUserConversations: async () => {
    try {
      const response = await api.get("/chat/conversations");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get specific conversation details
  getConversation: async (conversationId) => {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get messages for a conversation
  getConversationMessages: async (conversationId, skip = 0, take = 50) => {
    try {
      const response = await api.get(
        `/chat/conversations/${conversationId}/messages?skip=${skip}&take=${take}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Send a message
  sendMessage: async (conversationId, receiverId, content, attachments = []) => {
    try {
      const response = await api.post("/chat/messages", {
        conversationId,
        receiverId,
        content,
        attachments,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Mark message as read
  markMessageAsRead: async (conversationId, messageId) => {
    try {
      const response = await api.put(
        `/chat/conversations/${conversationId}/messages/${messageId}/read`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};