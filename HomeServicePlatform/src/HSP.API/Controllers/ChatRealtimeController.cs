//using HSP.Core.Dtos.ChatDto;
//using HSP.Service.Interfaces;
//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;
//using System.Security.Claims;
//using System.Text.Json;

//namespace HSP.API.Controllers
//{
//	[Route("api/[controller]")]
//	[ApiController]
//	[Authorize]
//	public class ChatRealtimeController : ControllerBase
//	{
//		private readonly IChatService _chatService;
//		private static readonly Dictionary<string, List<TaskCompletionSource<ChatMessageDto>>> _clients = new();
//		private static readonly object _lock = new object();

//		public ChatRealtimeController(IChatService chatService)
//		{
//			_chatService = chatService;
//		}

//		private Guid GetCurrentUserId()
//		{
//			var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
//			return Guid.Parse(userIdClaim!);
//		}

//		[HttpGet("stream/{conversationId}")]
//		public async Task StreamMessages(Guid conversationId)
//		{
//			var userId = GetCurrentUserId().ToString();
//			var clientKey = $"{userId}_{conversationId}";

//			Response.Headers["Content-Type"] = "text/event-stream";
//			Response.Headers["Cache-Control"] = "no-cache";
//			Response.Headers["Connection"] = "keep-alive";
//			Response.Headers["Access-Control-Allow-Origin"] = "*";

//			var tcs = new TaskCompletionSource<ChatMessageDto>();
			
//			lock (_lock)
//			{
//				if (!_clients.ContainsKey(clientKey))
//				{
//					_clients[clientKey] = new List<TaskCompletionSource<ChatMessageDto>>();
//				}
//				_clients[clientKey].Add(tcs);
//			}

//			try
//			{
//				// Send initial connection success message
//				await Response.WriteAsync($"data: {JsonSerializer.Serialize(new { type = "connected", conversationId })}\n\n");
//				await Response.Body.FlushAsync();

//				// Keep connection alive and wait for messages
//				while (!HttpContext.RequestAborted.IsCancellationRequested)
//				{
//					try
//					{
//						// Wait for new message or timeout
//						var message = await tcs.Task.WaitAsync(TimeSpan.FromSeconds(30), HttpContext.RequestAborted);
						
//						// Send the message to client
//						var eventData = JsonSerializer.Serialize(new { type = "message", data = message });
//						await Response.WriteAsync($"data: {eventData}\n\n");
//						await Response.Body.FlushAsync();

//						// Create new task for next message
//						tcs = new TaskCompletionSource<ChatMessageDto>();
//						lock (_lock)
//						{
//							_clients[clientKey].Add(tcs);
//						}
//					}
//					catch (TimeoutException)
//					{
//						// Send heartbeat
//						await Response.WriteAsync($"data: {JsonSerializer.Serialize(new { type = "heartbeat" })}\n\n");
//						await Response.Body.FlushAsync();
//					}
//					catch (OperationCanceledException)
//					{
//						break;
//					}
//				}
//			}
//			finally
//			{
//				// Clean up client connection
//				lock (_lock)
//				{
//					if (_clients.ContainsKey(clientKey))
//					{
//						_clients[clientKey].Remove(tcs);
//						if (_clients[clientKey].Count == 0)
//						{
//							_clients.Remove(clientKey);
//						}
//					}
//				}
//			}
//		}

//		[HttpPost("notify/{conversationId}")]
//		public async Task<IActionResult> NotifyNewMessage(Guid conversationId, [FromBody] ChatMessageDto message)
//		{
//			var notifiedClients = 0;

//			lock (_lock)
//			{
//				// Notify sender with isSentByCurrentUser = true
//				var senderClientKey = $"{message.SenderId}_{conversationId}";
//				var senderMessage = new ChatMessageDto 
//				{
//					Id = message.Id,
//					ConversationId = message.ConversationId,
//					SenderId = message.SenderId,
//					SenderName = message.SenderName,
//					ReceiverId = message.ReceiverId,
//					Content = message.Content,
//					SentAt = message.SentAt,
//					IsRead = message.IsRead,
//					IsSentByCurrentUser = true, // Always true for sender
//					Attachments = message.Attachments
//				};
				
//				if (_clients.ContainsKey(senderClientKey))
//				{
//					foreach (var tcs in _clients[senderClientKey].ToList())
//					{
//						if (!tcs.Task.IsCompleted)
//						{
//							tcs.SetResult(senderMessage);
//							notifiedClients++;
//						}
//					}
//				}
				
//				// Notify receiver with isSentByCurrentUser = false
//				var receiverClientKey = $"{message.ReceiverId}_{conversationId}";
//				var receiverMessage = new ChatMessageDto 
//				{
//					Id = message.Id,
//					ConversationId = message.ConversationId,
//					SenderId = message.SenderId,
//					SenderName = message.SenderName,
//					ReceiverId = message.ReceiverId,
//					Content = message.Content,
//					SentAt = message.SentAt,
//					IsRead = message.IsRead,
//					IsSentByCurrentUser = false, // Always false for receiver
//					Attachments = message.Attachments
//				};
				
//				if (_clients.ContainsKey(receiverClientKey))
//				{
//					foreach (var tcs in _clients[receiverClientKey].ToList())
//					{
//						if (!tcs.Task.IsCompleted)
//						{
//							tcs.SetResult(receiverMessage);
//							notifiedClients++;
//						}
//					}
//				}
//			}

//			return Ok(new { message = "Message broadcasted", clientsNotified = notifiedClients });
//		}

//		[HttpGet("conversations/{conversationId}/messages/poll")]
//		public async Task<ActionResult<List<ChatMessageDto>>> PollNewMessages(Guid conversationId, [FromQuery] DateTime? since = null)
//		{
//			try
//			{
//				var userId = GetCurrentUserId();
				
//				// Get messages since the specified timestamp
//				var sinceDate = since ?? DateTime.UtcNow.AddMinutes(-1);
//				var messages = await _chatService.GetConversationMessagesAsync(conversationId, userId);
				
//				// Filter messages newer than 'since' timestamp
//				var newMessages = messages.Where(m => m.SentAt > sinceDate).ToList();
				
//				return Ok(newMessages);
//			}
//			catch (Exception ex)
//			{
//				return BadRequest(new { message = ex.Message });
//			}
//		}

//		[HttpGet("health")]
//		public IActionResult Health()
//		{
//			lock (_lock)
//			{
//				return Ok(new { 
//					status = "healthy", 
//					activeConnections = _clients.Sum(kvp => kvp.Value.Count),
//					conversationsWithListeners = _clients.Count
//				});
//			}
//		}
//	}
//}