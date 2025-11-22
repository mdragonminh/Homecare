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
    ? "fixed bottom-20 right-5 w-16 h-16 z-50"
    : "fixed bottom-20 right-5 w-full max-w-sm h-[70vh] max-h-[600px] z-50"

  return (
    <div className={containerClasses}>
      <div
        className={`flex flex-col h-full bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden ${isMinimized ? "items-center justify-center" : ""}`}
      >
        {isMinimized ? (
          <button
            onClick={() => setIsMinimized(false)}
            className="w-full h-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:scale-110 active:scale-95 shadow-md flex items-center justify-center group"
            title="Mở rộng chat"
          >
            <PlusIcon className="w-8 h-8 text-white group-hover:rotate-90 transition-transform duration-300" />
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
