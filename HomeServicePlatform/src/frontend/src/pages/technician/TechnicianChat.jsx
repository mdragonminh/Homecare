import { useState, useEffect, useRef } from "react";
import { chatApi } from "../../services/chatApi";
import useChatSignalR from "../../hooks/useChatSignalR";
import { Send, Search, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";

export default function TechnicianChat() {
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

  const getOtherUserName = (c) =>
    c.technicianId?.toLowerCase() === currentUserId
      ? c.customerName || "Khách hàng"
      : "Không xác định";

  const getInitials = (name) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* SIDEBAR */}
      <div className="w-80 bg-white/95 backdrop-blur-xl border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Hỗ trợ khách hàng
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm khách hàng..."
              className="w-full pl-10 pr-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedConversation(c)}
              className={`w-full px-4 py-3 text-left transition-all hover:bg-purple-50 border-l-4 border-transparent ${
                selectedConversation?.id === c.id
                  ? "bg-purple-50 border-l-purple-500"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow">
                    {getInitials(getOtherUserName(c))}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <h3 className="font-semibold text-gray-900 truncate text-sm">
                      {getOtherUserName(c)}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {c.lastMessageTime &&
                        formatMessageTime(c.lastMessageTime)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 truncate mt-0.5">
                    {c.lastMessage?.content || "Chưa có tin nhắn"}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CHAT */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="bg-white/95 backdrop-blur border-b border-gray-200 px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow">
                      {getInitials(getOtherUserName(selectedConversation))}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-gray-900">
                      {getOtherUserName(selectedConversation)}
                    </h2>
                    <p className="text-xs font-medium text-emerald-600">
                      Đang hoạt động
                    </p>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full transition">
                  <MoreVertical className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 bg-gradient-to-b from-purple-50/20 to-white">
              <div className="max-w-3xl mx-auto space-y-5">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.isSentByCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-xs gap-2 ${
                        m.isSentByCurrentUser ? "flex-row-reverse" : ""
                      }`}
                    >
                      {!m.isSentByCurrentUser && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold shadow flex-shrink-0">
                          {getInitials(getOtherUserName(selectedConversation))}
                        </div>
                      )}
                      {m.isSentByCurrentUser && <div className="w-8" />}

                      <div>
                        <div
                          className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm font-medium ${
                            m.isSentByCurrentUser
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-none"
                              : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"
                          }`}
                        >
                          <p className="leading-6 break-words">{m.content}</p>
                        </div>
                        <p
                          className={`text-xs mt-1 ${
                            m.isSentByCurrentUser
                              ? "text-purple-200 text-right"
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
            <div className="bg-white/95 backdrop-blur border-t border-gray-200 p-4">
              <form
                onSubmit={handleSendMessage}
                className="flex gap-3 max-w-3xl mx-auto"
              >
                <input
                  type="text"
                  placeholder="Nhập tin nhắn hỗ trợ..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-5 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                />
                <button
                  type="submit"
                  className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 shadow-md transition"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* TRANG CHÀO MỪNG + ĐỒNG HỒ LIVE */
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100">
            <div className="text-center px-8 max-w-md animate-scale-in">
              <div className="relative mx-auto w-44 h-44 mb-10">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                <div className="relative flex items-center justify-center w-full h-full">
                  <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-10 shadow-2xl border border-white/60">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl">
                      <svg
                        className="w-12 h-12 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0114 16.5a3.374 3.374 0 01-2.667-1.314l-.548-.547z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-4 leading-tight">
                Chào mừng Kỹ thuật viên!
              </h1>
              <p className="text-xl text-gray-700 font-medium mb-3">
                Sẵn sàng hỗ trợ khách hàng
              </p>
              <p className="text-base text-gray-600 leading-relaxed mb-10">
                Chọn một khách hàng từ danh sách bên trái để bắt đầu tư vấn ngay
              </p>
              <div className="mb-10">
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
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
