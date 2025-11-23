import { useState, useEffect, useRef } from "react";
import { chatApi } from "../../services/chatApi";
import useChatSignalR from "../../hooks/useChatSignalR";
import { Send, Search, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";

export default function CustomerChat() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const currentUserId = localStorage.getItem("userId")?.toLowerCase();
  const token = localStorage.getItem("jwtToken");
  const messagesEndRef = useRef(null);

  const { realtimeMessages } = useChatSignalR(selectedConversation?.id, token);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) loadMessages();
  }, [selectedConversation]);

  useEffect(() => {
    if (realtimeMessages.length) loadMessages();
  }, [realtimeMessages]);

  const loadConversations = async () => {
    try {
      const res = await chatApi.getUserConversations();
      setConversations(res.data);
    } catch {
      toast.error("Không tải được danh sách hội thoại");
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;
    try {
      const res = await chatApi.getMessages(selectedConversation.id);
      setMessages(
        res.data.map((m) => ({
          ...m,
          content: m.content || m.Content,
          isSentByCurrentUser: m.senderId?.toLowerCase() === currentUserId,
        }))
      );
      scrollToBottom();
    } catch {
      toast.error("Không tải được tin nhắn");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const text = newMessage.trim();
    setNewMessage("");

    try {
      await chatApi.sendMessage(selectedConversation.id, text);
      loadMessages();
      loadConversations();
    } catch {
      toast.error("Không thể gửi tin nhắn");
      setNewMessage(text);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const vietnamTime = new Date(date.getTime() + 7 * 60 * 60 * 1000); // +7h

    if (isToday(vietnamTime)) {
      return format(vietnamTime, "HH:mm");
    }
    if (isYesterday(vietnamTime)) {
      return `Hôm qua ${format(vietnamTime, "HH:mm")}`;
    }
    return format(vietnamTime, "dd/MM/yyyy HH:mm");
  };

  const getChatName = (c) =>
    c.customerId?.toLowerCase() === currentUserId
      ? c.technicianName || "Kỹ thuật viên"
      : "Khách hàng";

  const getInitials = (name) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-96 bg-white/80 backdrop-blur-lg border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Tin nhắn
          </h1>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedConversation(c)}
              className={`w-full p-4 text-left transition-all hover:bg-gray-100 border-l-4 border-transparent ${
                selectedConversation?.id === c.id
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-blue-500"
                  : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {getInitials(getChatName(c))}
                  </div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-4 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {getChatName(c)}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {c.lastMessageTime &&
                        formatMessageTime(c.lastMessageTime)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {c.lastMessage?.content || "Chưa có tin nhắn"}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CHAT */}
      <div className="flex-1 flex flex-col min-h-0">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="bg-white/90 backdrop-blur border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                      {getInitials(getChatName(selectedConversation))}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-3 border-white"></div>
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">
                      {getChatName(selectedConversation)}
                    </h2>
                    <p className="text-sm text-green-600 font-medium">
                      Đang hoạt động
                    </p>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full transition">
                  <MoreVertical className="h-6 w-6 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-8 bg-gradient-to-b from-gray-50/50 to-white">
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.isSentByCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-md gap-3 ${
                        m.isSentByCurrentUser ? "flex-row-reverse" : ""
                      }`}
                    >
                      {!m.isSentByCurrentUser && (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow">
                          {getInitials(getChatName(selectedConversation))}
                        </div>
                      )}
                      {m.isSentByCurrentUser && <div className="w-9" />}

                      <div>
                        <div
                          className={`px-5 py-3 rounded-3xl shadow-md ${
                            m.isSentByCurrentUser
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none"
                              : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"
                          }`}
                        >
                          <p className="text-sm leading-relaxed break-words">
                            {m.content}
                          </p>
                        </div>
                        <p
                          className={`text-xs mt-1.5 ${
                            m.isSentByCurrentUser
                              ? "text-blue-400 text-right"
                              : "text-gray-500"
                          }`}
                        >
                          {formatMessageTime(m.sentAt || m.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="bg-white/90 backdrop-blur border-t border-gray-200 p-6">
              <form
                onSubmit={handleSendMessage}
                className="flex gap-4 max-w-4xl mx-auto"
              >
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-6 py-4 bg-gray-100 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-300 transition text-base"
                />
                <button
                  type="submit"
                  className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:from-blue-700 hover:to-indigo-700 shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <Send className="h-6 w-6" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
            <div className="text-center px-8 animate-scale-in">
              <div className="relative mx-auto w-48 h-48 mb-10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                <div className="relative flex items-center justify-center w-full h-full">
                  <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/50">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                      <Send className="h-12 w-12 text-white rotate-12" />
                    </div>
                  </div>
                </div>
              </div>

              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 leading-tight">
                Chào mừng bạn!
              </h1>
              <p className="text-xl text-gray-700 font-medium mb-3">
                Bắt đầu trò chuyện ngay hôm nay
              </p>
              <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed mb-10">
                Chọn một kỹ thuật viên bên trái để nhận hỗ trợ nhanh chóng
              </p>

              {/* ĐỒNG HỒ LIVE - CỰC CHUYÊN NGHIỆP */}
              <div className="mb-8">
                <p className="text-5xl font-bold text-gray-800 tracking-tight">
                  {new Date().toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </p>
                <p className="text-lg text-gray-600 mt-2 font-medium">
                  {new Date().toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="flex justify-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
