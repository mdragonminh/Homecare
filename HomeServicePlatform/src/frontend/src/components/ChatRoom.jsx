import React, { useEffect, useState } from "react";
import useChatSignalR from "../hooks/useChatSignalR";
import { chatApi } from "../services/chatApi";

export default function ChatRoom({ conversationId }) {
  const token = localStorage.getItem("jwtToken");

  const { realtimeMessages } = useChatSignalR(conversationId, token);

  const [history, setHistory] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    chatApi.getMessages(conversationId).then((res) => {
      setHistory(res.data);
    });
  }, [conversationId]);

  const sendMessage = async () => {
    await chatApi.sendMessage(conversationId, text);
    setText("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Conversation {conversationId}</h2>

      <div style={{ background: "#eee", height: 300, overflowY: "scroll" }}>
        {[...history, ...realtimeMessages].map((m, i) => (
          <div key={i}>
            <b>{m.senderId}:</b> {m.content}
          </div>
        ))}
      </div>

      <div>
        <input
          style={{ width: "80%" }}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
