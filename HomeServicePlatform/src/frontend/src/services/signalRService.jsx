import * as signalR from "@microsoft/signalr";

class SignalRService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.connectionPromise = null;
    this.messageHandlers = [];
    this.newMessageHandlers = [];
    this.messageReadHandlers = [];
  }

  async startConnection() {
    if (this.connectionPromise) {
      console.log("Connection promise already exists, returning existing");
      return this.connectionPromise;
    }

    if (
      this.connection &&
      this.connection.state === signalR.HubConnectionState.Connected
    ) {
      console.log("Already connected");
      return Promise.resolve();
    }

    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem("jwtToken");

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl("http://localhost:5093/chathub", {
          accessTokenFactory: () => token,
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Setup event handlers
      this.connection.onreconnecting(() => {
        console.log("SignalR reconnecting...");
        this.isConnected = false;
      });

      this.connection.onreconnected(() => {
        console.log("SignalR reconnected");
        this.isConnected = true;
      });

      this.connection.onclose((error) => {
        console.log("SignalR connection closed", error);
        this.isConnected = false;
        this.connectionPromise = null;
      });

      this.registerEventHandlersBefore();

      this.connectionPromise = this.connection
        .start()
        .then(() => {
          console.log("✅ SignalR Connected successfully");
          this.isConnected = true;
          this.connectionPromise = null;

          // Register all pending handlers
          this.registerEventHandlers();
        })
        .catch((error) => {
          console.error("❌ SignalR Connection Error: ", error);
          this.connectionPromise = null;
          throw error;
        });

      return this.connectionPromise;
    } catch (error) {
      console.error("❌ SignalR Setup Error: ", error);
      throw error;
    }
  }

  registerEventHandlers() {
    if (!this.connection) return;

    // Register ReceiveMessage handlers
    this.messageHandlers.forEach((callback) => {
      this.connection.on("ReceiveMessage", callback);
    });

    // Register NewMessage handlers
    this.newMessageHandlers.forEach((callback) => {
      this.connection.on("NewMessage", callback);
    });

    // Register MessageRead handlers
    this.messageReadHandlers.forEach((callback) => {
      this.connection.on("MessageRead", callback);
    });

    console.log("✅ Event handlers registered:", {
      ReceiveMessage: this.messageHandlers.length,
      NewMessage: this.newMessageHandlers.length,
      MessageRead: this.messageReadHandlers.length,
    });
  }

  registerEventHandlersBefore() {
    // Register ReceiveMessage handlers
    this.messageHandlers.forEach((callback) => {
      this.connection.on("ReceiveMessage", callback);
    });

    // Register NewMessage handlers
    this.newMessageHandlers.forEach((callback) => {
      this.connection.on("NewMessage", callback);
    });

    // Register MessageRead handlers
    this.messageReadHandlers.forEach((callback) => {
      this.connection.on("MessageRead", callback);
    });

    console.log("✅ Event handlers registered:", {
      ReceiveMessage: this.messageHandlers.length,
      NewMessage: this.newMessageHandlers.length,
      MessageRead: this.messageReadHandlers.length,
    });
  }

  async stopConnection() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.isConnected = false;
      this.connectionPromise = null;
    }

    // Clear handler arrays
    this.messageHandlers = [];
    this.newMessageHandlers = [];
    this.messageReadHandlers = [];
  }

  async joinConversation(conversationId) {
    if (!this.isConnected) {
      await this.startConnection();
    }

    try {
      await this.connection.invoke("JoinConversation", conversationId);
    } catch (error) {
      console.error("Error joining conversation:", error);
    }
  }

  async leaveConversation(conversationId) {
    if (!this.isConnected) return;

    try {
      await this.connection.invoke("LeaveConversation", conversationId);
    } catch (error) {
      console.error("Error leaving conversation:", error);
    }
  }

  async sendMessage(message) {
    if (!this.isConnected) {
      await this.startConnection();
    }

    try {
      await this.connection.invoke("SendMessage", message);
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  async markMessageRead(conversationId, messageId) {
    if (!this.isConnected) return;

    try {
      await this.connection.invoke(
        "MarkMessageRead",
        conversationId,
        messageId
      );
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  }

  onReceiveMessage(callback) {
    this.messageHandlers.push(callback);

    // If already connected, register immediately
    if (this.connection && this.isConnected) {
      this.connection.on("ReceiveMessage", callback);
    }
  }

  onNewMessage(callback) {
    this.newMessageHandlers.push(callback);

    // If already connected, register immediately
    if (this.connection && this.isConnected) {
      this.connection.on("NewMessage", callback);
    }
  }

  onMessageRead(callback) {
    this.messageReadHandlers.push(callback);

    // If already connected, register immediately
    if (this.connection && this.isConnected) {
      this.connection.on("MessageRead", callback);
    }
  }

  offReceiveMessage(callback) {
    this.messageHandlers = this.messageHandlers.filter((cb) => cb !== callback);
    if (this.connection) {
      this.connection.off("ReceiveMessage", callback);
    }
  }

  offNewMessage(callback) {
    this.newMessageHandlers = this.newMessageHandlers.filter(
      (cb) => cb !== callback
    );
    if (this.connection) {
      this.connection.off("NewMessage", callback);
    }
  }

  offMessageRead(callback) {
    this.messageReadHandlers = this.messageReadHandlers.filter(
      (cb) => cb !== callback
    );
    if (this.connection) {
      this.connection.off("MessageRead", callback);
    }
  }

  getConnectionState() {
    return this.connection
      ? this.connection.state
      : signalR.HubConnectionState.Disconnected;
  }
}

export const signalRService = new SignalRService();
export default signalRService;
