using HSP.API.Extensions;
using HSP.API.Hubs;
using HSP.Core.Dtos.ChatDto;
using HSP.Core.Dtos.Shared;
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
        private readonly IHubContext<ChatHub> _chatHub;

        public ChatController(IChatService chatService, IHubContext<ChatHub> chatHub)
		{
			_chatService = chatService;
            _chatHub = chatHub;
        }
        [HttpPost("conversation")]
        public async Task<IActionResult> CreateOrGetConversation([FromBody] CreateChatConversationDto input)
        {
            input.UserId = User.GetUserId();

            var id = await _chatService.CreateOrGetConversationAsync(input);
            return Ok(new { ConversationId = id });
        }
        [HttpPost("message")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageRequestDto input)
        {
            var userId = User.GetUserId();

            var msg = await _chatService.SendMessageAsync(userId, input);

            await _chatHub.Clients.Group(input.ConversationId.ToString())
                .SendAsync("ReceiveMessage", msg);

            return Ok(msg);
        }
        [HttpPost("messages")]
        public async Task<IActionResult> GetMessages([FromBody] MarkMessageReadDto input)
        {
            input.UserId = User.GetUserId();
            var result = await _chatService.GetMessagesAsync(input);
            return Ok(result);
        }
        [HttpGet("join/{conversationId}")]
        public async Task<IActionResult> JoinConversation(string conversationId)
        {
            await _chatHub.Clients.Group(conversationId).SendAsync("UserJoined", new
            {
                UserId = User.GetUserId(),
                ConversationId = conversationId
            });

            return Ok("Đã tham gia đoạn chat.");
        }
        [HttpGet("user-conversations")]
        public async Task<IActionResult> GetUserConversations()
        {
            var userId = User.GetUserId();
            var data = await _chatService.GetUserConversationsAsync(userId);
            return Ok(data);
        }
    }
}