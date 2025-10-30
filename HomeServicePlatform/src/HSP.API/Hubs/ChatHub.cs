using HSP.Core.Dtos.ChatDto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace HSP.API.Hubs
{
	[Authorize]
	public class ChatHub : Hub
	{
		public async Task JoinConversation(string conversationId)
		{
			await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
		}

		public async Task LeaveConversation(string conversationId)
		{
			await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
		}

		public async Task SendMessage(ChatMessageDto message)
		{
			// Broadcast message to conversation group
			await Clients.Group($"conversation_{message.ConversationId}")
				.SendAsync("ReceiveMessage", message);
		}

		public async Task MarkMessageRead(string conversationId, string messageId)
		{
			await Clients.Group($"conversation_{conversationId}")
				.SendAsync("MessageRead", messageId);
		}

		public override async Task OnConnectedAsync()
		{
			var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			if (!string.IsNullOrEmpty(userId))
			{
				await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
			}
			await base.OnConnectedAsync();
		}

		public override async Task OnDisconnectedAsync(Exception? exception)
		{
			var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			if (!string.IsNullOrEmpty(userId))
			{
				await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
			}
			await base.OnDisconnectedAsync(exception);
		}
	}
}