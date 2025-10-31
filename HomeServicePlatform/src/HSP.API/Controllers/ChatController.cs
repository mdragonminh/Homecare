using HSP.Core.Dtos.ChatDto;
using HSP.Core.Dtos.Shared;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	[Authorize]
	public class ChatController : ControllerBase
	{
		private readonly IChatService _chatService;
		private readonly IHttpClientFactory _httpClientFactory;

		public ChatController(IChatService chatService, IHttpClientFactory httpClientFactory)
		{
			_chatService = chatService;
			_httpClientFactory = httpClientFactory;
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
			[FromQuery] int pageNumber = 1, 
			[FromQuery] int pageSize = 50,
			[FromQuery] string? orderBy = "SentAt")
		{
			try
			{
				var userId = GetCurrentUserId();
				var paginationParams = new PaginationParams 
				{ 
					PageNumber = pageNumber, 
					PageSize = pageSize, 
					OrderBy = orderBy 
				};
				var messages = await _chatService.GetConversationMessagesAsync(conversationId, userId, paginationParams);
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

				// Trigger real-time notification via internal API call
				try
				{
					var httpClient = _httpClientFactory.CreateClient();
					var token = Request.Headers.Authorization.ToString().Replace("Bearer ", "");
					httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
					
					await httpClient.PostAsJsonAsync($"{Request.Scheme}://{Request.Host}/api/ChatRealtime/notify/{sendDto.ConversationId}", message);
				}
				catch (Exception notifyEx)
				{
					// Log notification error but don't fail the message send
					Console.WriteLine($"Failed to notify clients: {notifyEx.Message}");
				}

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

				return Ok(new { message = "Message marked as read" });
			}
			catch (Exception ex)
			{
				return BadRequest(new { message = ex.Message });
			}
		}
	}
}