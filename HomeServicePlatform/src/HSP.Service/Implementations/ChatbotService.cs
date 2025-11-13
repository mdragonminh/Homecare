using HSP.Core.Dtos.ChatbotDto;
using HSP.Core.Dtos.ConfigurationDto;
using HSP.Core.Dtos.ServiceRequestDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using OpenAI.Chat;
using System.Text.Json;
using ChatMessage = OpenAI.Chat.ChatMessage;

namespace HSP.Service.Implementations
{
    public class ChatbotService : BaseService, IChatbotService
    {
        private readonly ChatClient _client;
        private readonly IServiceRequestService _serviceRequestService;
        private readonly IRepository<Core.Entities.Service, Guid> _serviceRepository;
        private readonly IRepository<ChatMessageHistory, Guid> _historyRepository;
        private readonly OpenAISettingsDto _settings;

        public ChatbotService(
                IConfiguration configuration,
                IServiceRequestService serviceRequestService,
                IRepository<Core.Entities.Service, Guid> serviceRepository,
                IRepository<ChatMessageHistory, Guid> historyRepository,
                IOptions<OpenAISettingsDto> options,
                IUnitOfWork unitOfWork,
                IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
        {
            _serviceRequestService = serviceRequestService;
            _serviceRepository = serviceRepository;
            _historyRepository = historyRepository;
            _settings = options.Value;
            _client = new ChatClient(_settings.Model, _settings.ApiKey);
        }

        public async Task<string> GetChatResponseAsync(string prompt)
        {
            var messages = new OpenAI.Chat.ChatMessage[]
                {
                        new SystemChatMessage("Bạn là AI chuyên xử lý ngôn ngữ tiếng Việt."),
                        new UserChatMessage(prompt)
                };

            var completion = await _client.CompleteChatAsync(messages);
            return completion.Value.Content[0].Text;
        }

        public async Task<ChatResponseDto> ProcessMessageAsync(ChatInputDto input, Guid customerId)
        {
            Guid conversationId = input.ConversationId ?? Guid.NewGuid();
            string customerIdString = customerId.ToString();
            DateTime turnTimestamp = DateTime.UtcNow;

            var (systemPrompt, createBookingTool) = await PrepareChatContextAsync();

            List<ChatMessage> messages = new List<ChatMessage> { systemPrompt };
            messages.AddRange(await LoadChatHistoryAsync(conversationId, customerId));

            messages.Add(new UserChatMessage(input.Message));
            List<ChatMessageHistory> newMessagesToSave = new List<ChatMessageHistory>
            {
                new ChatMessageHistory
                {
                    ConversationId = conversationId,
                    CustomerId = customerId,
                    Role = "User",
                    Content = input.Message,
                    DateCreated = turnTimestamp,
                    DateModified = turnTimestamp
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
                ChatCompletion completion = await GetChatCompletionWithRetryAsync(messages, options);

                switch (completion.FinishReason)
                {
                    case ChatFinishReason.Stop:
                        (finalAssistantResponse, turnTimestamp) = HandleStopMessage(
                            completion, newMessagesToSave, conversationId, customerId, turnTimestamp);
                        messages.Add(new AssistantChatMessage(finalAssistantResponse));
                        break;

                    case ChatFinishReason.ToolCalls:
                        messages.Add(new AssistantChatMessage(completion));
                        turnTimestamp = HandleAssistantToolCallMessage(
                            completion, newMessagesToSave, conversationId, customerId, turnTimestamp);

                        foreach (ChatToolCall toolCall in completion.ToolCalls)
                        {
                            (turnTimestamp, requiresAction) = await HandleToolCallExecutionAsync(
                                toolCall, messages, newMessagesToSave, turnTimestamp, customerIdString, conversationId, customerId);
                        }
                        break;

                    default:
                        throw new NotImplementedException(completion.FinishReason.ToString());
                }
            } while (requiresAction);

            await SaveHistoryAsync(newMessagesToSave);

            return new ChatResponseDto
            {
                Response = finalAssistantResponse,
                ConversationId = conversationId
            };
        }

        private async Task<(SystemChatMessage, ChatTool)> PrepareChatContextAsync()
        {
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

            string toolDescription = _localizer["ChatbotToolDescription"];

            var createBookingTool = ChatTool.CreateFunctionTool(
                functionName: "create_booking_request",
                functionDescription: toolDescription,
                functionParameters: BinaryData.FromBytes(schemaBytes)
            );

            string systemPromptStr = _localizer["ChatbotSystemPrompt", servicesJsonForPrompt];

            TimeZoneInfo vietnamZone;
            try { vietnamZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time"); }
            catch (TimeZoneNotFoundException) { vietnamZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh"); }

            DateTime vietnamTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamZone);
            string currentDateContext = $"\n## Current Time Context\n" +
                                        $"Current Date (Hôm nay là): {vietnamTime:dddd, dd MMMM yyyy, HH:mm} (Vietnam Time, UTC+7)." +
                                        $"Use this as the 'current date' for all time-related inferences.";

            systemPromptStr += currentDateContext;

            return (new SystemChatMessage(systemPromptStr), createBookingTool);
        }

        private async Task<List<ChatMessage>> LoadChatHistoryAsync(Guid conversationId, Guid customerId)
        {
            var history = await _historyRepository.GetAll()
                .Where(h => h.ConversationId == conversationId && h.CustomerId == customerId)
                .OrderBy(h => h.DateCreated)
                .ToListAsync();

            List<ChatMessage> messages = new List<ChatMessage>();
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
                        string argumentsString = dbMsg.FunctionArguments;
                        BinaryData argumentsBinaryData = BinaryData.FromString(argumentsString);
                        var toolCall = ChatToolCall.CreateFunctionToolCall(dbMsg.ToolCallId, dbMsg.FunctionName, argumentsBinaryData);
                        var toolCallsList = new[] { toolCall };
                        messages.Add(new AssistantChatMessage(toolCallsList));
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
            return messages;
        }

        private (string Response, DateTime NewTimestamp) HandleStopMessage(ChatCompletion completion, List<ChatMessageHistory> newMessagesToSave, Guid conversationId, Guid customerId, DateTime currentTimestamp)
        {
            string finalAssistantResponse = string.Empty;
            if (completion.Content.Count > 0)
            {
                finalAssistantResponse = completion.Content[0].Text;
            }

            DateTime newTimestamp = currentTimestamp.AddSeconds(1);
            newMessagesToSave.Add(new ChatMessageHistory
            {
                ConversationId = conversationId,
                CustomerId = customerId,
                Role = "Assistant",
                Content = finalAssistantResponse,
                DateCreated = newTimestamp,
                DateModified = newTimestamp
            });

            return (finalAssistantResponse, newTimestamp);
        }

        private DateTime HandleAssistantToolCallMessage(ChatCompletion completion, List<ChatMessageHistory> newMessagesToSave, Guid conversationId, Guid customerId, DateTime currentTimestamp)
        {
            DateTime newTimestamp = currentTimestamp;
            foreach (var toolCall in completion.ToolCalls)
            {
                newTimestamp = newTimestamp.AddSeconds(1);
                newMessagesToSave.Add(new ChatMessageHistory
                {
                    ConversationId = conversationId,
                    CustomerId = customerId,
                    Role = "Assistant",
                    ToolCallId = toolCall.Id,
                    FunctionName = toolCall.FunctionName,
                    FunctionArguments = toolCall.FunctionArguments.ToString(),
                    DateCreated = newTimestamp,
                    DateModified = newTimestamp
                });
            }
            return newTimestamp;
        }

        private async Task<(DateTime NewTimestamp, bool RequiresAction)> HandleToolCallExecutionAsync(
            ChatToolCall toolCall, List<ChatMessage> messages, List<ChatMessageHistory> newMessagesToSave,
            DateTime currentTimestamp, string customerIdString, Guid conversationId, Guid customerId)
        {
            string toolResultString;
            bool requiresAction = false;

            if (toolCall.FunctionName == "create_booking_request")
            {
                try
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

                    MatchedBookingResultDto matchResult = await _serviceRequestService.CreateAndMatchBookingAsync(bookingDto);
                    object toolResultSummary;
                    if (matchResult.IsMatched)
                    {
                        toolResultSummary = new { status = "success", message = matchResult.Message ?? "Đã tìm thấy kỹ thuật viên.", technicianName = matchResult.TechnicianInfo?.Name, distanceKm = matchResult.TechnicianInfo?.DistanceKm };
                    }
                    else
                    {
                        toolResultSummary = new { status = "failed", message = matchResult.Message };
                    }
                    toolResultString = JsonSerializer.Serialize(toolResultSummary);
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"Error: {ex.Message}");
                    toolResultString = JsonSerializer.Serialize(new { status = "error", message = "Đã xảy ra lỗi hệ thống khi cố gắng xử lý đặt lịch.", errorMessage = ex.Message });
                }

                messages.Add(new ToolChatMessage(toolCall.Id, toolResultString));
                requiresAction = true;

                DateTime newTimestamp = currentTimestamp.AddSeconds(1);
                newMessagesToSave.Add(new ChatMessageHistory
                {
                    ConversationId = conversationId,
                    CustomerId = customerId,
                    Role = "Tool",
                    Content = toolResultString,
                    ToolCallId = toolCall.Id,
                    DateCreated = newTimestamp,
                    DateModified = newTimestamp
                });

                return (newTimestamp, requiresAction);
            }

            return (currentTimestamp, requiresAction);
        }

        private async Task<ChatCompletion> GetChatCompletionWithRetryAsync(List<ChatMessage> messages, ChatCompletionOptions options)
        {
            try
            {
                return await _client.CompleteChatAsync(messages, options);
            }
            catch (Exception openAiEx)
            {
                throw new InvalidOperationException("Chat histories error", openAiEx);
            }
        }

        private async Task SaveHistoryAsync(List<ChatMessageHistory> newMessagesToSave)
        {
            if (newMessagesToSave.Any())
            {
                await _historyRepository.AddRangeAsync(newMessagesToSave);
                await _unitOfWork.SaveChangesAsync();
            }
        }
    }
}