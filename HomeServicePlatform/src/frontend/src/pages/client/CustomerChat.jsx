import { useState, useEffect, useRef } from "react";
import { chatApi } from "../../services/chatApi";
import useChatSignalR from "../../hooks/useChatSignalR";
import { Send } from "lucide-react";
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

  const { realtimeMessages } = useChatSignalR(
    selectedConversation?.id,
    token
  );

  useEffect(() => {
    if (!realtimeMessages.length) return;

    console.log("Realtime trigger UI reload");
    loadMessages();
  }, [realtimeMessages]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await chatApi.getUserConversations();
      setConversations(res.data);
    } catch {
      toast.error("Không tải được danh sách hội thoại");
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
    }
  }, [selectedConversation]);

  const loadMessages = async () => {
    if (!selectedConversation) return;
    try {
      const res = await chatApi.getMessages(selectedConversation.id);
      setMessages(
        res.data.map(m => ({
          ...m,
          content: m.content || m.Content,
          isSentByCurrentUser:
            m.senderId?.toLowerCase() === currentUserId
        }))
      );
      scrollToBottom();
    } catch {
      toast.error("Không tải được tin nhắn");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

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
    }, 50);
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    if (isToday(d)) return format(d, "HH:mm");
    if (isYesterday(d)) return "Hôm qua " + format(d, "HH:mm");
    return format(d, "dd/MM/yyyy HH:mm");
  };

  const getChatName = (c) =>
    c.customerId?.toLowerCase() === currentUserId
      ? c.technicianName
      : c.customerName;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* LEFT SIDEBAR */}
      <div className="w-80 bg-white border-r shadow">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Tin nhắn</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedConversation(c)}
              className={`w-full px-4 py-4 text-left border-b hover:bg-slate-50 ${
                selectedConversation?.id === c.id
                  ? "bg-blue-50 border-l-4 border-blue-600"
                  : ""
              }`}
            >
              <div className="font-semibold">{getChatName(c)}</div>
              {c.lastMessage && (
                <p className="text-sm text-gray-500 truncate">
                  {c.lastMessage.content}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">
            {selectedConversation
              ? getChatName(selectedConversation)
              : "Chọn cuộc trò chuyện"}
          </h2>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.isSentByCurrentUser ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-3 max-w-xs rounded-xl shadow ${
                  m.isSentByCurrentUser
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-200 text-black rounded-bl-none"
                }`}
              >
                <p>{m.content}</p>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef}></div>
        </div>

        {selectedConversation && (
          <form
            onSubmit={handleSendMessage}
            className="p-6 border-t flex gap-3 bg-gray-50"
          >
            <input
              className="flex-1 px-4 py-3 border rounded-lg bg-white"
              placeholder="Nhập tin nhắn..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />

            <button className="p-3 bg-blue-600 text-white rounded-lg">
              <Send />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
