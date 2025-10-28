using HSP.Core.Dtos.ServiceRequestDto;
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
        // lưu lịch sử chat
        // public string ConversationId { get; set; } 
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


    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatbotController : ControllerBase
    {
        private readonly ChatClient _client;
        private readonly IServiceRequestService _serviceRequestService;
        private readonly IRepository<Core.Entities.Service, Guid> _serviceRepository;

        public ChatbotController(IConfiguration configuration,
                                 IServiceRequestService serviceRequestService,
                                 IRepository<Core.Entities.Service, Guid> serviceRepository)
        {
            var apiKey = configuration["OPENAI_API_KEY"];
            _client = new("gpt-4o", apiKey);
            _serviceRequestService = serviceRequestService;
            _serviceRepository = serviceRepository;
        }

        [HttpPost("chat")]
        public async Task<IActionResult> PostChat([FromBody] ChatInputDto input)
        {
            var customerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(customerId))
            {
                return Unauthorized(new { message = "User is not authenticated" });
            }

            var availableServices = await _serviceRepository.GetAll()
                .Select(s => new { s.Id, s.Name })
                .ToListAsync();

            var servicesJsonForPrompt = JsonSerializer.Serialize(availableServices);

            string jsonSchema = $$"""
            {
                "type": "object",
                "properties": {
                    "Address": {
                        "type": "string",
                        "description": "Địa chỉ đầy đủ của khách hàng, ví dụ: '123 đường ABC, phường XYZ, quận 1, TPHCM'"
                    },
                    "DesireDateTime": {
                        "type": "string",
                        "format": "date-time",
                        "description": "Ngày giờ mong muốn thực hiện dịch vụ, định dạng ISO 8601, ví dụ: '2025-10-30T14:30:00'"
                    },
                    "ServiceIds": {
                        "type": "array",
                        "description": "Danh sách các ID của dịch vụ mà khách hàng muốn đặt. Lấy ID từ danh sách được cung cấp.",
                        "items": {
                            "type": "string",
                            "description": "ID (Guid) của một dịch vụ",
                            "enum": [ {{string.Join(",", availableServices.Select(s => $"\"{s.Id}\""))}} ]
                        }
                    }
                },
                "required": [ "Address", "DesireDateTime", "ServiceIds" ]
            }
            """;

            byte[] schemaBytes = System.Text.Encoding.UTF8.GetBytes(jsonSchema);

            var createBookingTool = ChatTool.CreateFunctionTool(
                functionName: "create_booking_request",
                functionDescription: "Tạo một yêu cầu đặt dịch vụ (booking) mới cho người dùng. Chỉ gọi khi đã có ĐỦ 3 thông tin: Address, DesireDateTime, và ServiceIds.",
                functionParameters: BinaryData.FromBytes(schemaBytes)
            );

            string systemPrompt = $$"""
            Bạn LÀ trợ lý ảo của Home Service Platform. Vai trò DUY NHẤT của bạn là thu thập thông tin đặt lịch.
            
            ## Quy tắc BẮT BUỘC:
            1.  Nhiệm vụ của bạn là lấy 3 thông tin: `Address` (Địa chỉ), `DesireDateTime` (Thời gian), và `ServiceIds` (Dịch vụ).
            2.  **PHẢI HỎI LẠI** nếu thiếu bất kỳ thông tin nào. Ví dụ:
                * Nếu user chỉ nói "dọn nhà", hãy hỏi: "Bạn muốn dọn nhà ở đâu và vào lúc nào ạ?"
                * Nếu user nói "dọn nhà ở Hòa Lạc", hãy hỏi: "Bạn muốn dọn vào lúc nào?"
            3.  **CHỈ** gọi hàm `create_booking_request` khi và CHỈ KHI bạn đã có CẢ 3 thông tin.
            4.  **KHÔNG ĐƯỢC** tự trả lời lỗi. Nếu bạn không hiểu, hãy hỏi lại.
            
            ## Danh sách dịch vụ (Name và Id):
            {{servicesJsonForPrompt}}
            Hãy dùng đúng Id này khi gọi hàm.
            """;

            List<ChatMessage> messages =
            [
                new SystemChatMessage(systemPrompt),
                new UserChatMessage(input.Message),
            ];

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
                            break;
                        }

                    case ChatFinishReason.ToolCalls:
                        {
                            messages.Add(new AssistantChatMessage(completion));

                            foreach (ChatToolCall toolCall in completion.ToolCalls)
                            {
                                if (toolCall.FunctionName == "create_booking_request")
                                {
                                    using JsonDocument argumentsJson = JsonDocument.Parse(toolCall.FunctionArguments);
                                    var gptArgs = argumentsJson.RootElement.Deserialize<GptBookingArgs>();

                                    var bookingDto = new CustomerCreateBookingDto
                                    {
                                        Address = gptArgs.Address,
                                        DesireDateTime = gptArgs.DesireDateTime,
                                        ServiceIds = gptArgs.ServiceIds.Select(Guid.Parse).ToList(),
                                        CustomerId = customerId,
                                        DistanceKm = 50
                                    };

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
                                }
                            }
                            break;
                        }

                    default:
                        throw new NotImplementedException(completion.FinishReason.ToString());
                }
            } while (requiresAction);

            return Ok(new { response = finalAssistantResponse });
        }
    }
}