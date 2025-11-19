// class ChatRealtimeService {
//   constructor() {
//     this.baseURL = "http://localhost:5093/api";
//     this.eventSource = null;
//     this.isConnected = false;
//     this.currentConversationId = null;
//     this.messageHandlers = [];
//     this.connectionHandlers = [];
//     this.errorHandlers = [];
//     this.pollingInterval = null;
//     this.lastMessageTime = new Date();
//   }

//   async connectToConversation(conversationId) {
//     if (this.currentConversationId === conversationId && this.isConnected) {
//       return;
//     }

//     // Only disconnect the connection, but keep handlers
//     this.disconnectConnection();
//     this.currentConversationId = conversationId;

//     try {
//       await this.startSSEConnection(conversationId);
//     } catch (error) {
//       console.warn("SSE connection failed, falling back to polling:", error);
//       this.startPolling(conversationId);
//     }
//   }

//   // Start Server-Sent Events connection
//   async startSSEConnection(conversationId) {
//     const token = localStorage.getItem("jwtToken");
//     if (!token) {
//       throw new Error("No authentication token found");
//     }

//     const url = `${this.baseURL}/ChatRealtime/stream/${conversationId}`;

//     try {
//       const response = await fetch(url, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           Accept: "text/event-stream",
//           "Cache-Control": "no-cache",
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`SSE connection failed: ${response.status}`);
//       }

//       this.isConnected = true;
//       this.connectionHandlers.forEach((handler) => handler({ status: "connected" }));

//       const reader = response.body.getReader();
//       const decoder = new TextDecoder();

//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;

//         const chunk = decoder.decode(value);
//         const lines = chunk.split('\n');

//         for (const line of lines) {
//           if (line.startsWith('data: ')) {
//             try {
//               const data = JSON.parse(line.slice(6));
//               this.handleIncomingData(data);
//             } catch (error) {
//               console.error("Error parsing SSE message:", error);
//             }
//           }
//         }
//       }
//     } catch (error) {
//       this.handleConnectionError(error);
//       throw error;
//     }
//   }

//   handleIncomingData(data) {
//     switch (data.type) {
//       case "message":
//         this.lastMessageTime = new Date();

//         // Normalize properties to camelCase - clean object without PascalCase pollution
//         const message = {
//           id: data.data.id || data.data.Id || Date.now(),
//           conversationId: data.data.conversationId || data.data.ConversationId,
//           content: data.data.content || data.data.Content,
//           sentAt: data.data.sentAt || data.data.SentAt || new Date().toISOString(),
//           senderId: data.data.senderId || data.data.SenderId,
//           senderName: data.data.senderName || data.data.SenderName,
//           receiverId: data.data.receiverId || data.data.ReceiverId,
//           isRead: data.data.isRead || data.data.IsRead,
//           isSentByCurrentUser: data.data.isSentByCurrentUser || data.data.IsSentByCurrentUser,
//           attachments: data.data.attachments || data.data.Attachments || [],
//         };

//         // Trigger all message handlers
//         this.messageHandlers.forEach((handler) => {
//           try {
//             handler(message);
//           } catch (error) {
//             console.error("Error in message handler:", error);
//           }
//         });
//         break;

//       case "heartbeat":
//         // Keep connection alive
//         break;

//       default:
//         break;
//     }
//   }

//   // Fallback polling mechanism
//   startPolling(conversationId) {
//     this.pollingInterval = setInterval(async () => {
//       try {
//         await this.pollForNewMessages(conversationId);
//       } catch (error) {
//         console.error("Polling error:", error);
//       }
//     }, 3000);
//   }

//   async pollForNewMessages(conversationId) {
//     const token = localStorage.getItem("jwtToken");
//     if (!token) return;

//     try {
//       const response = await fetch(
//         `${this.baseURL}/ChatRealtime/conversations/${conversationId}/messages/poll?since=${this.lastMessageTime.toISOString()}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       if (response.ok) {
//         const newMessages = await response.json();

//         if (newMessages.length > 0) {
//           newMessages.forEach((message) => {
//             // Normalize properties to camelCase - clean object without PascalCase pollution
//             const formattedMessage = {
//               id: message.id || message.Id || Date.now(),
//               conversationId: message.conversationId || message.ConversationId,
//               content: message.content || message.Content,
//               sentAt: message.sentAt || message.SentAt || new Date().toISOString(),
//               senderId: message.senderId || message.SenderId,
//               senderName: message.senderName || message.SenderName,
//               receiverId: message.receiverId || message.ReceiverId,
//               isRead: message.isRead || message.IsRead,
//               isSentByCurrentUser: message.isSentByCurrentUser || message.IsSentByCurrentUser,
//               attachments: message.attachments || message.Attachments || [],
//             };

//             this.messageHandlers.forEach((handler) => {
//               try {
//                 handler(formattedMessage);
//               } catch (error) {
//                 console.error("Error in polling message handler:", error);
//               }
//             });
//           });

//           // Update last message time
//           const latestMessage = newMessages[newMessages.length - 1];
//           this.lastMessageTime = new Date(latestMessage.sentAt);
//         }
//       }
//     } catch (error) {
//       console.error("Polling request failed:", error);
//     }
//   }

//   handleConnectionError(error) {
//     this.isConnected = false;
//     this.errorHandlers.forEach((handler) => handler(error));

//     // Try to reconnect after 5 seconds
//     setTimeout(() => {
//       if (this.currentConversationId && !this.isConnected) {
//         this.connectToConversation(this.currentConversationId);
//       }
//     }, 5000);
//   }

//   // Disconnect only connection, keep handlers
//   disconnectConnection() {
//     if (this.eventSource) {
//       this.eventSource.close();
//       this.eventSource = null;
//     }

//     if (this.pollingInterval) {
//       clearInterval(this.pollingInterval);
//       this.pollingInterval = null;
//     }

//     this.isConnected = false;
//   }

//   // Disconnect from current conversation
//   disconnect() {
//     this.disconnectConnection();

//     // Clear all handlers to prevent memory leaks and duplicates
//     this.messageHandlers = [];
//     this.connectionHandlers = [];
//     this.errorHandlers = [];

//     this.currentConversationId = null;
//   }

//   // Event handlers
//   onMessage(callback) {
//     this.messageHandlers.push(callback);
//   }

//   onConnection(callback) {
//     this.connectionHandlers.push(callback);
//   }

//   onError(callback) {
//     this.errorHandlers.push(callback);
//   }

//   // Send message (still uses regular HTTP API)
//   async sendMessage(conversationId, receiverId, content) {
//     const token = localStorage.getItem("jwtToken");
//     if (!token) {
//       throw new Error("No authentication token found");
//     }

//     try {
//       const response = await fetch(`${this.baseURL}/Chat/messages`, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           conversationId,
//           receiverId,
//           content,
//         }),
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`Failed to send message: ${response.status} - ${errorText}`);
//       }

//       const result = await response.json();
//       return result;
//     } catch (error) {
//       console.error("Failed to send message:", error);
//       throw error;
//     }
//   }
// }

// // Create singleton instance
// export const chatRealtimeService = new ChatRealtimeService();
// export default chatRealtimeService;