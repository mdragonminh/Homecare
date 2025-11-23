"use client"

import { useState, useRef, useEffect } from "react"
import { chatbotApi } from "../../services/chatbotApi"
import { toast } from "sonner"
import { PaperAirplaneIcon, XMarkIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/solid"
import { useTranslation } from "react-i18next"

const ChatMessage = ({ message }) => {
  const isUser = message.sender === "user"
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl shadow-sm transition-all ${
          isUser ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-100 text-gray-900 rounded-bl-none"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
      </div>
    </div>
  )
}

export const ChatWidget = ({ onClose }) => {
  const { t } = useTranslation()
  const [messages, setMessages] = useState([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const [isMinimized, setIsMinimized] = useState(false)

  const messagesEndRef = useRef(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isMinimized])

  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true)
      setIsLoading(true)

      const fetchWelcomeMessage = async () => {
        try {
          const payload = {
            message: "__INIT_CONVERSATION__",
            conversationId: null,
          }
          const data = await chatbotApi.postMessage(payload)

          const assistantMessage = { sender: "assistant", text: data.response }
          setMessages([assistantMessage])
          setConversationId(data.conversationId)
        } catch (error) {
          console.error("Error fetching welcome message:", error)
          toast.error("Không thể kết nối với chatbot.")
          setMessages([
            {
              sender: "assistant",
              text: "Xin lỗi, tôi gặp chút sự cố kết nối.",
            },
          ])
        } finally {
          setIsLoading(false)
        }
      }
      fetchWelcomeMessage()
    }
  }, [isInitialized])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const messageText = currentMessage.trim()
    if (!messageText || isLoading) return

    setIsLoading(true)
    const userMessage = { sender: "user", text: messageText }
    setMessages((prev) => [...prev, userMessage])
    setCurrentMessage("")

    try {
      const payload = { message: messageText, conversationId: conversationId }
      const data = await chatbotApi.postMessage(payload)
      const assistantMessage = { sender: "assistant", text: data.response }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error posting message:", error)
      toast.error("Lỗi: Không thể gửi tin nhắn.")
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "Xin lỗi, tôi gặp chút sự cố. Bạn vui lòng thử lại sau nhé.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

 const containerClasses = isMinimized 
  ? "fixed bottom-20 right-5 w-16 h-16 rounded-full overflow-hidden z-50" 
  : "fixed bottom-20 right-5 w-full max-w-sm h-[70vh] max-h-[600px] rounded-2xl z-50"

  return (
    <div className={containerClasses}>
      <div
        className={`flex flex-col h-full bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden ${isMinimized ? "items-center justify-center" : ""}`}
      >
        {isMinimized ? (
         // Thay vì dùng icon dấu +, dùng icon chat bubble
// Thay vì dùng icon dấu +, dùng icon chat bubble
<button
  onClick={() => setIsMinimized(false)}
  className="w-full h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:scale-110 active:scale-95 shadow-md flex items-center justify-center group"
  title="Mở chat"
>
  {/* Icon chat bubble */}
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="white" 
    className="w-8 h-8"
  >
    <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
    <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
  </svg>
</button>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md">
              <h3
                className="font-bold text-lg cursor-pointer hover:opacity-90 transition-opacity select-none"
                onClick={() => setIsMinimized(true)}
              >
                HomeService
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-2 rounded-lg hover:bg-blue-500 transition-all duration-200 hover:scale-110 active:scale-95"
                  title="Thu nhỏ"
                >
                  <MinusIcon className="w-5 h-5" />
                </button>

                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="p-2 rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-all duration-200 hover:scale-110 active:scale-95"
                  title="Đóng chat"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gradient-to-b from-gray-50 to-white">
              {messages.map((msg, index) => (
                <ChatMessage key={index} message={msg} />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-3">
                  <div className="max-w-xs px-4 py-2.5 rounded-2xl shadow-sm bg-gray-100 text-gray-900 rounded-bl-none">
                    <div className="flex gap-1 items-center">
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder={t("chat.placeholder", "Nhập tin nhắn của bạn...")}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400 text-sm"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
                  disabled={isLoading || !currentMessage.trim()}
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
