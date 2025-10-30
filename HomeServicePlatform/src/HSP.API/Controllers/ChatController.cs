using HSP.API.Hubs;
using HSP.Core.Dtos.ChatDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	[Authorize]
	public class ChatController : ControllerBase
	{
		private readonly IChatService _chatService;
		private readonly IHubContext<ChatHub> _hubContext;

		public ChatController(IChatService chatService, IHubContext<ChatHub> hubContext)
		{
			_chatService = chatService;
			_hubContext = hubContext;
		}

		private Guid GetCurrentUserId()
		{
			var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			return Guid.Parse(userIdClaim!);
		}

		[HttpPost("conversations")]
		public async Task<ActionResult<ChatConversationDto>> CreateOrGetConversation([FromBody] CreateChatConversationDto createDto)
		{
			try
			{
				var conversation = await _chatService.CreateOrGetConversationAsync(createDto);
				return Ok(conversation);
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}

		[HttpGet("conversations")]
		public async Task<ActionResult<List<ChatConversationDto>>> GetUserConversations()
		{
			try
			{
				var userId = GetCurrentUserId();
				var conversations = await _chatService.GetUserConversationsAsync(userId);
				return Ok(conversations);
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}

		[HttpGet("conversations/{conversationId}")]
		public async Task<ActionResult<ChatConversationDto>> GetConversation(Guid conversationId)
		{
			try
			{
				var userId = GetCurrentUserId();
				var conversation = await _chatService.GetConversationAsync(conversationId, userId);
				
				if (conversation == null)
				{
					return NotFound(new { message = "Conversation not found or access denied" });
				}

				return Ok(conversation);
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}

		[HttpGet("conversations/{conversationId}/messages")]
		public async Task<ActionResult<List<ChatMessageDto>>> GetConversationMessages(
			Guid conversationId, 
			[FromQuery] int skip = 0, 
			[FromQuery] int take = 50)
		{
			try
			{
				var userId = GetCurrentUserId();
				var messages = await _chatService.GetConversationMessagesAsync(conversationId, userId, skip, take);
				return Ok(messages);
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}

		[HttpPost("messages")]
		public async Task<ActionResult<ChatMessageDto>> SendMessage([FromBody] SendChatMessageDto sendDto)
		{
			try
			{
				var senderId = GetCurrentUserId();
				var message = await _chatService.SendMessageAsync(sendDto, senderId);

				// Send real-time notification via SignalR
				await _hubContext.Clients.Group($"conversation_{sendDto.ConversationId}")
					.SendAsync("ReceiveMessage", message);

				// Also send to specific user in case they're not in the conversation group
				await _hubContext.Clients.Group($"user_{sendDto.ReceiverId}")
					.SendAsync("NewMessage", message);

				return Ok(message);
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}

		[HttpPut("conversations/{conversationId}/messages/{messageId}/read")]
		public async Task<ActionResult> MarkMessageAsRead(Guid conversationId, Guid messageId)
		{
			try
			{
				var userId = GetCurrentUserId();
				await _chatService.MarkMessageAsReadAsync(conversationId, messageId, userId);

				// Notify via SignalR that message was read
				await _hubContext.Clients.Group($"conversation_{conversationId}")
					.SendAsync("MessageRead", messageId);

				return Ok(new { message = "Message marked as read" });
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}
	}
}