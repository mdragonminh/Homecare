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

            TimeZoneInfo vietnamZone;
            try
            {
                // Windows
                vietnamZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            }
            catch (TimeZoneNotFoundException)
            {
                // Linux/MacOS
                vietnamZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
            }

            DateTime vietnamTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamZone);

            string currentDateContext = $"\n## Current Time Context\n" +
                                        $"Current Date (Hôm nay là): {vietnamTime:dddd, dd MMMM yyyy, HH:mm} (Vietnam Time, UTC+7)." +
                                        $"Use this as the 'current date' for all time-related inferences.";

            systemPrompt += currentDateContext;

            List<OpenAI.Chat.ChatMessage> messages = new List<OpenAI.Chat.ChatMessage>
            {
                new SystemChatMessage(systemPrompt) 
            };

			List<OpenAI.Chat.ChatMessage> messages = new List<OpenAI.Chat.ChatMessage>
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