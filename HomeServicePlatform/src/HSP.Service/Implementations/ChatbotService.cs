using HSP.Core.Dtos.ChatbotDto;
using HSP.Core.Dtos.ServiceRequestDto;
using HSP.Core.Dtos.ChatbotDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using OpenAI.Chat;
using System.Text.Json;

namespace HSP.Service.Implementations
{
    public class ChatbotService : IChatbotService
    {
        private readonly ChatClient _client;
        private readonly IServiceRequestService _serviceRequestService;
        private readonly IRepository<Core.Entities.Service, Guid> _serviceRepository;
        private readonly IRepository<ChatMessageHistory, Guid> _historyRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ChatbotService(
            IConfiguration configuration,
            IServiceRequestService serviceRequestService,
            IRepository<Core.Entities.Service, Guid> serviceRepository,
            IRepository<ChatMessageHistory, Guid> historyRepository,
            IUnitOfWork unitOfWork)
        {
            _serviceRequestService = serviceRequestService;
            _serviceRepository = serviceRepository;
            _historyRepository = historyRepository;
            _unitOfWork = unitOfWork;

            var apiKey = configuration["OPENAI_API_KEY"];
            if (string.IsNullOrEmpty(apiKey))
            {
                throw new ArgumentNullException(nameof(apiKey), "OPENAI_API_KEY is not set.");
            }
            _client = new("gpt-4o", apiKey);
        }

        public async Task<ChatResponseDto> ProcessMessageAsync(ChatInputDto input, Guid customerId)
        {
            Guid conversationId = input.ConversationId ?? Guid.NewGuid();
            string customerIdString = customerId.ToString();

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
            var bookingSchema = new BookingToolParameters { Properties = toolProperties };
            var schemaBytes = JsonSerializer.SerializeToUtf8Bytes(bookingSchema);

            var createBookingTool = ChatTool.CreateFunctionTool(
                functionName: "create_booking_request",
                functionDescription: "Tạo một yêu cầu đặt dịch vụ (booking) mới cho người dùng. Chỉ gọi khi đã có ĐỦ 3 thông tin: Address, DesireDateTime, và ServiceIds.",
                functionParameters: BinaryData.FromBytes(schemaBytes)
            );

            // System Prompt
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

            List<ChatMessage> messages = new List<ChatMessage>
            {
                new SystemChatMessage(systemPrompt)
            };

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

            List<ChatMessageHistory> newMessagesToSave = new List<ChatMessageHistory>
            {
                new ChatMessageHistory
                {
                    ConversationId = conversationId,
                    CustomerId = customerId,
                    Role = "User",
                    Content = input.Message,
                    DateCreated = DateTime.UtcNow,
                    DateModified = DateTime.UtcNow
                }
            };

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

                                    var bookingDto = new CustomerCreateBookingDto
                                    {
                                        Address = gptArgs.Address,
                                        DesireDateTime = gptArgs.DesireDateTime,
                                        ServiceIds = gptArgs.ServiceIds.Select(Guid.Parse).ToList(),
                                        CustomerId = customerIdString
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

            return new ChatResponseDto
            {
                Response = finalAssistantResponse,
                ConversationId = conversationId
            };
        }
    }
}