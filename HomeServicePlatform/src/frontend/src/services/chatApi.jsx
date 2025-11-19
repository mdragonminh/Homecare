import axiosClient from "../config/axiosClient";
export const chatApi = {
  createOrGetConversation: (bookingId) => {
    return axiosClient.post("/chat/conversation", {
      bookingId,
    });
  },
   sendMessage: (conversationId, content, attachments = []) => {
    return axiosClient.post("/chat/message", {
      conversationId,
      content,
      attachments,
    });
  },
  getMessages: (conversationId) => {
    return axiosClient.post("/chat/messages", {
      conversationId
    });
  },
  joinConversation: (conversationId) => {
    return axiosClient.get(`/chat/join/${conversationId}`);
  },
  getUserConversations: () =>{
    return axiosClient.get("/chat/user-conversations")
  }, 
};