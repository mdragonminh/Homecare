import React, { useState, useRef, useEffect } from "react";
import { chatbotApi } from "../../services/chatbotApi"; 
import { toast } from "sonner";
import { PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

const ChatMessage = ({ message }) => {
  const isUser = message.sender === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
};

export const ChatWidget = ({ onClose }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false); 

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      setIsLoading(true); 

      const fetchWelcomeMessage = async () => {
        try {
          const payload = {
            message: "__INIT_CONVERSATION__",
            conversationId: null,
          };
          const data = await chatbotApi.postMessage(payload);

          const assistantMessage = { sender: "assistant", text: data.response };
          setMessages([assistantMessage]);
          setConversationId(data.conversationId);
        } catch (error) {
          console.error("Error fetching welcome message:", error);
          toast.error("Không thể kết nối với chatbot.");
          setMessages([{
            sender: "assistant",
            text: "Xin lỗi, tôi gặp chút sự cố kết nối."
          }]);
        } finally {
          setIsLoading(false); 
        }
      };
      fetchWelcomeMessage();
    }
  }, [isInitialized]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const messageText = currentMessage.trim();
    if (!messageText || isLoading) return;

    setIsLoading(true);
    const userMessage = { sender: "user", text: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setCurrentMessage("");

    try {
      const payload = { message: messageText, conversationId: conversationId };
      const data = await chatbotApi.postMessage(payload);
      const assistantMessage = { sender: "assistant", text: data.response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error posting message:", error);
      toast.error("Lỗi: Không thể gửi tin nhắn.");
      setMessages((prev) => [...prev, {
        sender: "assistant",
        text: "Xin lỗi, tôi gặp chút sự cố. Bạn vui lòng thử lại sau nhé."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-5 w-full max-w-sm h-[70vh] max-h-[600px] z-50">
      <div className="flex flex-col h-full bg-white rounded-lg shadow-xl border border-gray-300">
        
        <div className="flex items-center justify-between p-4 bg-blue-600 text-white rounded-t-lg">
          <h3 className="font-semibold text-lg">Hỗ trợ đặt lịch</h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-full hover:bg-blue-700 disabled:opacity-50"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="max-w-xs px-4 py-3 rounded-lg shadow bg-gray-100 text-gray-900">
                <span className="loading loading-dots loading-sm"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <input
              type="text"
              value={currentMessage}
              
              onChange={(e) => setCurrentMessage(e.target.value)} 
              
              placeholder={t("chat.placeholder", "Nhập tin nhắn của bạn...")}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isLoading || !currentMessage.trim()}
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};