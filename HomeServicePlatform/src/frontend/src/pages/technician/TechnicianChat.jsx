import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { chatApi } from "../../services/chatApi.jsx";
import chatRealtimeService from "../../services/chatRealtimeService.jsx";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Send,
  Phone,
  MapPin,
  Clock,
  MoreVertical,
  Search,
  Plus,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

export const TechnicianChat = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
    initializeChatRealtime();

    return () => {
      window.removeEventListener("resize", checkMobile);
      chatRealtimeService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
      connectToConversation(selectedConversation.id);
      if (isMobile) {
        setShowConversationList(false);
      }
    }
  }, [selectedConversation, isMobile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChatRealtime = async () => {
    try {
      chatRealtimeService.onMessage((message) => {
        setSelectedConversation((currentSelected) => {
          setMessages((prevMessages) => {
            if (
              currentSelected &&
              message.conversationId === currentSelected.id
            ) {
              const existingMessage = prevMessages.find(
                (m) => m.id === message.id
              );
              if (existingMessage) {
                return prevMessages;
              }
              return [...prevMessages, message];
            }
            return prevMessages;
          });

          // Show notification
          if (
            !currentSelected ||
            message.conversationId !== currentSelected.id
          ) {
            // Only show notification if message is not from current user
            if (message.senderId !== currentUserId) {
              toast.info(
                `Tin nhắn mới từ ${message.senderName || "Người dùng"}`
              );
            }
          }

          return currentSelected;
        });

        updateConversationLastMessage(message);
      });

      chatRealtimeService.onConnection((data) => {
        toast.success("Kết nối chat thành công");
      });

      chatRealtimeService.onError((error) => {
        console.error("Chat realtime error:", error);
        toast.error("Lỗi kết nối chat");
      });
    } catch (error) {
      console.error("Chat realtime initialization error:", error);
      toast.error("Không thể khởi tạo chat real-time");
    }
  };

  const connectToConversation = async (conversationId) => {
    try {
      await chatRealtimeService.connectToConversation(conversationId);
    } catch (error) {
      console.error("Failed to connect to conversation:", error);
      toast.error("Không thể kết nối đến cuộc trò chuyện");
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
      const data = await chatApi.getConversationMessages(
        selectedConversation.id
      );
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Không thể tải tin nhắn");
    } finally {
      setMessagesLoading(false);
    }
  };

  const updateConversationLastMessage = (message) => {
    setConversations((prev) =>
      prev
        .map((conv) =>
          conv.id === message.conversationId
            ? {
                ...conv,
                lastMessage: message,
                unreadCount:
                  message.senderId !== currentUserId
                    ? conv.unreadCount + 1
                    : conv.unreadCount,
              }
            : conv
        )
        .sort((a, b) => {
          const aTime = a.lastMessage?.sentAt || a.createdAt;
          const bTime = b.lastMessage?.sentAt || b.createdAt;
          return new Date(bTime) - new Date(aTime);
        })
    );
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const receiverId =
      selectedConversation.customerId === currentUserId
        ? selectedConversation.technicianId
        : selectedConversation.customerId;

    const messageContent = newMessage.trim();

    setNewMessage("");

    try {
      const result = await chatRealtimeService.sendMessage(
        selectedConversation.id,
        receiverId,
        messageContent
      );
    } catch (error) {
      console.error("❌ Error sending message:", error);
      setNewMessage(messageContent);
      toast.error("Không thể gửi tin nhắn");
    }
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    setConversations((prev) =>
      prev.map((conv) =>
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

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Left Sidebar - Chat List */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Tin nhắn</h1>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Đang tải...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Chưa có hội thoại nào
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => handleConversationSelect(conversation)}
                className={`w-full px-4 py-4 border-b border-slate-100 text-left transition-all duration-200 hover:bg-slate-50 ${
                  selectedConversation?.id === conversation.id
                    ? "bg-purple-50 border-l-4 border-l-purple-500"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-xl shadow-md">
                    👤
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {getOtherUserName(conversation)}
                      </h3>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <p className="text-sm text-slate-500 truncate">
                        {conversation.lastMessage.content ||
                          "Đã gửi file đính kèm"}
                      </p>
                    )}
                    {conversation.lastMessage && (
                      <p className="text-xs text-slate-400">
                        {formatMessageTime(conversation.lastMessage.sentAt)}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Middle - Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {selectedConversation
                ? getOtherUserName(selectedConversation)
                : "Chọn cuộc trò chuyện"}
            </h2>
            {selectedConversation?.bookingDescription && (
              <p className="text-sm text-slate-500 mt-1">
                Booking: {selectedConversation.bookingDescription}
              </p>
            )}
          </div>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <MoreVertical className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {messagesLoading ? (
            <div className="text-center text-gray-500">
              Đang tải tin nhắn...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500">
              Chưa có tin nhắn nào
            </div>
          ) : (
            messages
              .filter((msg) => {
                // Filter out messages without content
                const content = msg.content || msg.Content;
                return content && content.trim().length > 0;
              })
              .map((msg) => {
                const content = msg.content || msg.Content || "";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.isSentByCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl shadow-sm transition-all duration-200 ${
                        msg.isSentByCurrentUser
                          ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-br-none"
                          : "bg-slate-100 text-slate-900 rounded-bl-none"
                      }`}
                    >
                      <p className="text-base leading-relaxed">{content}</p>
                      <p
                        className={`text-xs mt-2 ${
                          msg.isSentByCurrentUser
                            ? "text-purple-100"
                            : "text-slate-500"
                        }`}
                      >
                        {formatMessageTime(msg.sentAt)}
                        {msg.isSentByCurrentUser && msg.isRead && (
                          <span className="ml-1">✓✓</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-8 py-6 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <form onSubmit={handleSendMessage} className="flex items-end gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-6 h-6" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar - Booking Details */}
      <div className="w-96 bg-gradient-to-br from-slate-50 to-slate-100 border-l border-slate-200 overflow-y-auto">
        {selectedConversation ? (
          <div className="p-8 space-y-8">
            {/* Header */}
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Chi tiết công việc
              </h3>
              <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                <CheckCircle className="w-5 h-5" />
                Đã xác nhận
              </div>
            </div>

            {/* Service Info */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Loại dịch vụ
                </p>
                <p className="text-lg font-bold text-slate-900">
                  {selectedConversation.bookingDescription ||
                    "Chưa có thông tin"}
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Thời gian
                    </p>
                    <p className="text-base font-semibold text-slate-900">
                      {selectedConversation.createdAt
                        ? format(
                            new Date(selectedConversation.createdAt),
                            "dd/MM/yyyy HH:mm"
                          )
                        : "Chưa có thông tin"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Placeholder Image */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <img
                src="/service-image.jpg"
                alt="Service"
                className="relative w-full h-48 object-cover rounded-xl shadow-lg group-hover:shadow-xl transition-all"
              />
            </div>

            {/* Customer Info */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900">Khách hàng</h4>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all">
                <p className="font-semibold text-slate-900 mb-3">
                  {selectedConversation.customerName || "Chưa có thông tin"}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Phone className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Liên hệ qua chat</span>
                  </div>
                  <div className="flex items-start gap-3 text-slate-600">
                    <MapPin className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Địa chỉ sẽ được cập nhật</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900">Thanh toán</h4>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 text-sm text-amber-600 font-semibold bg-amber-50 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  Chờ thanh toán
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => navigate("/")}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200 transform hover:scale-105"
              >
                <ArrowLeft className="w-5 h-5" />
                {t("ui.back_to_home")}
              </button>
              <button className="w-full py-3 border-2 border-slate-300 text-slate-900 rounded-lg font-semibold hover:bg-slate-50 transition-all duration-200">
                Hoàn thành công việc
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500">
            <div className="text-center">
              <p>Chọn cuộc trò chuyện để xem chi tiết</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianChat;
