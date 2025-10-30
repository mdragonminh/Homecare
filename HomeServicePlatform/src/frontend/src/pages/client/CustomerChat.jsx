import React, { useState, useEffect, useRef } from "react";
import { chatApi } from "../../services/chatApi.jsx";
import signalRService from "../../services/signalRService.jsx";
import { toast } from "sonner";
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  UserCircleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { format, isToday, isYesterday } from "date-fns";

const CustomerChat = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const messagesEndRef = useRef(null);
  const currentUserId = localStorage.getItem("userId");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setShowConversationList(window.innerWidth >= 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    loadConversations();
    initializeSignalR();

    return () => {
      window.removeEventListener("resize", checkMobile);
      signalRService.stopConnection();
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
      signalRService.joinConversation(selectedConversation.id);
      if (isMobile) {
        setShowConversationList(false);
      }
    }
  }, [selectedConversation, isMobile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeSignalR = async () => {
    try {
      await signalRService.startConnection();
      
      signalRService.onReceiveMessage((message) => {
        if (selectedConversation && message.conversationId === selectedConversation.id) {
          setMessages(prev => [...prev, message]);
        }
        updateConversationLastMessage(message);
      });

      signalRService.onNewMessage((message) => {
        updateConversationLastMessage(message);
        if (!selectedConversation || message.conversationId !== selectedConversation.id) {
          toast.info(`Tin nhắn mới từ ${message.senderName}`);
        }
      });

      signalRService.onMessageRead((messageId) => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, isRead: true } : msg
          )
        );
      });

    } catch (error) {
      console.error("SignalR initialization error:", error);
      toast.error("Không thể kết nối real-time chat");
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatApi.getUserConversations();
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error("Không thể tải danh sách hội thoại");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;

    try {
      setMessagesLoading(true);
      const data = await chatApi.getConversationMessages(selectedConversation.id);
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Không thể tải tin nhắn");
    } finally {
      setMessagesLoading(false);
    }
  };

  const updateConversationLastMessage = (message) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === message.conversationId 
          ? { 
              ...conv, 
              lastMessage: message,
              unreadCount: message.senderId !== currentUserId ? conv.unreadCount + 1 : conv.unreadCount 
            }
          : conv
      ).sort((a, b) => {
        const aTime = a.lastMessage?.sentAt || a.createdAt;
        const bTime = b.lastMessage?.sentAt || b.createdAt;
        return new Date(bTime) - new Date(aTime);
      })
    );
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const receiverId = selectedConversation.customerId === currentUserId 
      ? selectedConversation.technicianId 
      : selectedConversation.customerId;

    try {
      await chatApi.sendMessage(
        selectedConversation.id,
        receiverId,
        newMessage.trim()
      );
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Không thể gửi tin nhắn");
    }
  };

  const handleConversationSelect = (conversation) => {
    if (selectedConversation) {
      signalRService.leaveConversation(selectedConversation.id);
    }
    setSelectedConversation(conversation);
    
    // Reset unread count
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
      )
    );
  };

  const handleBackToList = () => {
    setShowConversationList(true);
    setSelectedConversation(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return `Hôm qua ${format(date, "HH:mm")}`;
    } else {
      return format(date, "dd/MM/yyyy HH:mm");
    }
  };

  const getOtherUserName = (conversation) => {
    return conversation.customerId === currentUserId 
      ? conversation.technicianName 
      : conversation.customerName;
  };

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        {showConversationList ? (
          // Mobile Conversations List
          <div className="flex-1 bg-white">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Tin nhắn</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Đang tải...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Chưa có hội thoại nào
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation)}
                    className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <UserCircleIcon className="w-10 h-10 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {getOtherUserName(conversation)}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.lastMessage.content || "Đã gửi file đính kèm"}
                          </p>
                        )}
                        {conversation.lastMessage && (
                          <p className="text-xs text-gray-400">
                            {formatMessageTime(conversation.lastMessage.sentAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          // Mobile Chat View
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleBackToList}
                  className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <UserCircleIcon className="w-8 h-8 text-gray-400" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedConversation && getOtherUserName(selectedConversation)}
                  </h3>
                  {selectedConversation?.bookingDescription && (
                    <p className="text-sm text-gray-500">
                      Booking: {selectedConversation.bookingDescription}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="text-center text-gray-500">Đang tải tin nhắn...</div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.isSentByCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.isSentByCurrentUser
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.isSentByCurrentUser ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        {formatMessageTime(message.sentAt)}
                        {message.isSentByCurrentUser && message.isRead && (
                          <span className="ml-1">✓✓</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <PaperClipIcon className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop View
  return (
    <div className="h-screen flex bg-gray-50">
      {/* Conversations List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tin nhắn</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Đang tải...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Chưa có hội thoại nào
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationSelect(conversation)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.id === conversation.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <UserCircleIcon className="w-10 h-10 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getOtherUserName(conversation)}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.lastMessage.content || "Đã gửi file đính kèm"}
                      </p>
                    )}
                    {conversation.lastMessage && (
                      <p className="text-xs text-gray-400">
                        {formatMessageTime(conversation.lastMessage.sentAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <UserCircleIcon className="w-8 h-8 text-gray-400" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {getOtherUserName(selectedConversation)}
                  </h3>
                  {selectedConversation.bookingDescription && (
                    <p className="text-sm text-gray-500">
                      Booking: {selectedConversation.bookingDescription}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="text-center text-gray-500">Đang tải tin nhắn...</div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.isSentByCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isSentByCurrentUser
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.isSentByCurrentUser ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        {formatMessageTime(message.sentAt)}
                        {message.isSentByCurrentUser && message.isRead && (
                          <span className="ml-1">✓✓</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <PaperClipIcon className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <UserCircleIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Chọn một hội thoại để bắt đầu chat</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerChat;