import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

const SIGNALR_URL = import.meta.env.VITE_SIGNALR_URL;

export default function useChatSignalR(conversationId, token) {
  const connectionRef = useRef(null);
  const [realtimeMessages, setRealtimeMessages] = useState([]);

  // CREATE OR RECREATE CONNECTION WHEN conversationId or token changes
  useEffect(() => {
    if (!conversationId || !token) return;

    if (connectionRef.current) {
      console.log("🧹 Stopping previous connection...");
      connectionRef.current.stop();
    }

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${SIGNALR_URL}?conversationId=${conversationId}`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = conn;

    conn.on("ReceiveMessage", (msg) => {
      console.log("📥 Realtime received:", msg);
      setRealtimeMessages((prev) => [...prev, msg]);
    });

    conn.start()
      .then(() => {
        console.log("✅ SignalR Connected");
        return conn.invoke("JoinGroup", conversationId);
      })
      .then(() => console.log("📌 Joined group:", conversationId))
      .catch((err) => console.error("❌ SignalR Error:", err));

    return () => {
      console.log("🧹 Cleanup: stop connection");
      conn.stop();
    };
  }, [conversationId, token]); 

  return { realtimeMessages };
}
