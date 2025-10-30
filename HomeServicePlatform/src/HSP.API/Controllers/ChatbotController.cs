using HSP.Core.Dtos.ServiceRequestDto;
using HSP.Core.Entities; 
using HSP.Core.Interfaces.DataAccess;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenAI.Chat;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace HSP.API.Controllers
{
    public class ChatInputDto
    {
        public string Message { get; set; }
        public Guid? ConversationId { get; set; }
    }

    public class GptBookingArgs
    {
        [JsonPropertyName("Address")]
        public string Address { get; set; }

        [JsonPropertyName("DesireDateTime")]
        public DateTime DesireDateTime { get; set; }

        [JsonPropertyName("ServiceIds")]
        public List<string> ServiceIds { get; set; }
    }

    public class BookingToolParameters
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = "object";

        [JsonPropertyName("properties")]
        public BookingToolProperties Properties { get; set; }

        [JsonPropertyName("required")]
        public List<string> Required { get; set; } = ["Address", "DesireDateTime", "ServiceIds"];
    }

    public class BookingToolProperties
    {
        [JsonPropertyName("Address")]
        public ToolProperty Address { get; set; } = new("string", "Địa chỉ đầy đủ của khách hàng, ví dụ: '123 đường ABC, phường XYZ, quận 1, TPHCM'");

        [JsonPropertyName("DesireDateTime")]
        public ToolProperty DesireDateTime { get; set; } = new("string", "Ngày giờ mong muốn thực hiện dịch vụ, định dạng ISO 8601, ví dụ: '2025-10-30T14:30:00'") { Format = "date-time" };

        [JsonPropertyName("ServiceIds")]
        public ToolProperty ServiceIds { get; set; } 
    }

    public class ToolProperty
    {
        [JsonPropertyName("type")]
        public string Type { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; }

        [JsonPropertyName("format")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Format { get; set; }

        [JsonPropertyName("items")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public ToolPropertyItems? Items { get; set; }

        public ToolProperty(string type, string description)
        {
            Type = type;
            Description = description;
        }
    }

    public class ToolPropertyItems
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = "string";

        [JsonPropertyName("description")]
        public string Description { get; set; } = "ID (Guid) của một dịch vụ";

        [JsonPropertyName("enum")]
        public List<string> Enum { get; set; } 
    }


    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatbotController : ControllerBase
    {
        private readonly ChatClient _client;
        private readonly IServiceRequestService _serviceRequestService;
        private readonly IRepository<Core.Entities.Service, Guid> _serviceRepository;
        private readonly IRepository<ChatMessageHistory, Guid> _historyRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ChatbotController(IConfiguration configuration,
                                 IServiceRequestService serviceRequestService,
                                 IRepository<Core.Entities.Service, Guid> serviceRepository,
                                 IRepository<ChatMessageHistory, Guid> historyRepository,
                                 IUnitOfWork unitOfWork)
        {
            var apiKey = configuration["OPENAI_API_KEY"];
            _client = new("gpt-4o", apiKey);
            _serviceRequestService = serviceRequestService;
            _serviceRepository = serviceRepository;
            _historyRepository = historyRepository;
            _unitOfWork = unitOfWork;
        }

        [HttpPost("chat")]
        public async Task<IActionResult> PostChat([FromBody] ChatInputDto input)
        {
            var customerIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(customerIdString) || !Guid.TryParse(customerIdString, out Guid customerId))
            {
                return Unauthorized(new { message = "User is not authenticated" });
            }

            Guid conversationId = input.ConversationId ?? Guid.NewGuid();

            var availableServices = await _serviceRepository.GetAll()
                .Select(s => new { s.Id, s.Name })
                .ToListAsync();
            var servicesJsonForPrompt = JsonSerializer.Serialize(availableServices);
            var toolProperties = new BookingToolProperties
            {
                ServiceIds = new ToolProperty("array", "Danh sách các ID của dịch vụ mà khách hàng muốn đặt.")
                {
                    Items = new ToolPropertyItems
                    {
                        Enum = availableServices.Select(s => s.Id.ToString()).ToList()
                    }
                }
            };

            var bookingSchema = new BookingToolParameters
            {
                Properties = toolProperties
            };

            var schemaBytes = JsonSerializer.SerializeToUtf8Bytes(bookingSchema);

            var createBookingTool = ChatTool.CreateFunctionTool(
                functionName: "create_booking_request",
                functionDescription: "Tạo một yêu cầu đặt dịch vụ (booking) mới cho người dùng. Chỉ gọi khi đã có ĐỦ 3 thông tin: Address, DesireDateTime, và ServiceIds.",
                functionParameters: BinaryData.FromBytes(schemaBytes)
            );
            string systemPrompt = $$""" ... """;

            List<ChatMessage> messages = new List<ChatMessage>();

            messages.Add(new SystemChatMessage(systemPrompt));

            var history = await _historyRepository.GetAll()
                .Where(h => h.ConversationId == conversationId && h.CustomerId == customerId)
                .OrderBy(h => h.DateCreated)
                .ToListAsync();

            foreach (var dbMsg in history)
            {
                if (dbMsg.Role == "User")
                {
                    messages.Add(new UserChatMessage(dbMsg.Content));
                }
                else if (dbMsg.Role == "Assistant")
                {
                    if (!string.IsNullOrEmpty(dbMsg.FunctionName))
                    {
                        messages.Add(new AssistantChatMessage(
                            dbMsg.ToolCallId,
                            dbMsg.FunctionName,
                            dbMsg.FunctionArguments));
                    }
                    else
                    {
                        messages.Add(new AssistantChatMessage(dbMsg.Content));
                    }
                }
                else if (dbMsg.Role == "Tool")
                {
                    messages.Add(new ToolChatMessage(dbMsg.ToolCallId, dbMsg.Content));
                }
            }

            messages.Add(new UserChatMessage(input.Message));

            List<ChatMessageHistory> newMessagesToSave = new List<ChatMessageHistory>();
            newMessagesToSave.Add(new ChatMessageHistory
            {
                ConversationId = conversationId,
                CustomerId = customerId,
                Role = "User",
                Content = input.Message,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow
            });

            ChatCompletionOptions options = new()
            {
                Tools = { createBookingTool },
                ToolChoice = ChatToolChoice.CreateAutoChoice()
            };

            bool requiresAction;
            string finalAssistantResponse = string.Empty;

            do
            {
                requiresAction = false;
                ChatCompletion completion = await _client.CompleteChatAsync(messages, options);

                switch (completion.FinishReason)
                {
                    case ChatFinishReason.Stop:
                        {
                            messages.Add(new AssistantChatMessage(completion));
                            if (completion.Content.Count > 0)
                            {
                                finalAssistantResponse = completion.Content[0].Text;
                            }

                            newMessagesToSave.Add(new ChatMessageHistory
                            {
                                ConversationId = conversationId,
                                CustomerId = customerId,
                                Role = "Assistant",
                                Content = finalAssistantResponse,
                                DateCreated = DateTime.UtcNow,
                                DateModified = DateTime.UtcNow
                            });
                            break;
                        }

                    case ChatFinishReason.ToolCalls:
                        {
                            messages.Add(new AssistantChatMessage(completion));

                            foreach (ChatToolCall toolCall in completion.ToolCalls)
                            {
                                newMessagesToSave.Add(new ChatMessageHistory
                                {
                                    ConversationId = conversationId,
                                    CustomerId = customerId,
                                    Role = "Assistant",
                                    ToolCallId = toolCall.Id,
                                    FunctionName = toolCall.FunctionName,
                                    FunctionArguments = toolCall.FunctionArguments.ToString(),
                                    DateCreated = DateTime.UtcNow,
                                    DateModified = DateTime.UtcNow
                                });

                                if (toolCall.FunctionName == "create_booking_request")
                                {
                                    using JsonDocument argumentsJson = JsonDocument.Parse(toolCall.FunctionArguments);
                                    var gptArgs = argumentsJson.RootElement.Deserialize<GptBookingArgs>();
                                    var bookingDto = new CustomerCreateBookingDto { /* ... */ };
                                    bookingDto.Address = gptArgs.Address;
                                    bookingDto.DesireDateTime = gptArgs.DesireDateTime;
                                    bookingDto.ServiceIds = gptArgs.ServiceIds.Select(Guid.Parse).ToList();
                                    bookingDto.CustomerId = customerIdString;

                                    string toolResultString;
                                    try
                                    {
                                        MatchedBookingResultDto matchResult = await _serviceRequestService.CreateAndMatchBookingAsync(bookingDto);
                                        toolResultString = JsonSerializer.Serialize(matchResult);
                                    }
                                    catch (Exception ex)
                                    {
                                        toolResultString = JsonSerializer.Serialize(new { error = ex.Message });
                                    }

                                    messages.Add(new ToolChatMessage(toolCall.Id, toolResultString));
                                    requiresAction = true;

                                    newMessagesToSave.Add(new ChatMessageHistory
                                    {
                                        ConversationId = conversationId,
                                        CustomerId = customerId,
                                        Role = "Tool",
                                        Content = toolResultString,
                                        ToolCallId = toolCall.Id, 
                                        DateCreated = DateTime.UtcNow,
                                        DateModified = DateTime.UtcNow
                                    });
                                }
                            }
                            break;
                        }

                    default:
                        throw new NotImplementedException(completion.FinishReason.ToString());
                }
            } while (requiresAction);

            if (newMessagesToSave.Any())
            {
                await _historyRepository.AddRangeAsync(newMessagesToSave);
                await _unitOfWork.SaveChangesAsync(); 
            }

            return Ok(new
            {
                response = finalAssistantResponse,
                conversationId = conversationId 
            });
        }
    }
}