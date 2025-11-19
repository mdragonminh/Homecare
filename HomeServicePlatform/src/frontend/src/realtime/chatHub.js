import * as signalR from "@microsoft/signalr";

export const createChatConnection = (conversationId, token) => {
    return new signalR.HubConnectionBuilder()
        .withUrl(
            `${import.meta.env.VITE_API_URL.replace("/api", "")}/hubs/chat?conversationId=${conversationId}`,
            {
                accessTokenFactory: () => token,
                withCredentials: true
            }
        )
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();
};
