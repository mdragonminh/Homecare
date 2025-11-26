using HSP.API.Extensions;
using HSP.Core.Dtos.AuditLogDto;
using HSP.Core.Enums;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;
using System.Text.Json;

namespace HSP.API.Filters
{
	[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
	public class AuditLogAttribute : ActionFilterAttribute
	{
		public AuditAction Action { get; set; }
		public string EntityName { get; set; } = null!;
		public bool CaptureRequestBody { get; set; } = true;

		public AuditLogAttribute(AuditAction action, string entityName)
		{
			Action = action;
			EntityName = entityName;
		}

		public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
		{
			// Get service from DI
			var auditLogService = context.HttpContext.RequestServices.GetService<IAuditLogService>();
			
		if (auditLogService == null)
		{
			await next();
			return;
		}

		// Skip audit logging if user is not authenticated
		if (!context.HttpContext.User.Identity?.IsAuthenticated ?? true)
		{
			await next();
			return;
		}

		// Get user info
		var userId = context.HttpContext.User.GetUserId();
		var userName = context.HttpContext.User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
		var userRole = context.HttpContext.User.FindFirst(ClaimTypes.Role)?.Value ?? "Unknown";

		// Try to get entity ID from route or query parameters
		Guid? entityId = null;
		if (Action == AuditAction.Update || Action == AuditAction.Delete)
		{
			if (context.ActionArguments.ContainsKey("id"))
			{
				var idValue = context.ActionArguments["id"];
				if (idValue is Guid guidId)
				{
					entityId = guidId;
				}
			}
		}

		// Execute the action
		var executedContext = await next();

		// Only log if action succeeded
		if (executedContext.Exception == null && 
		    executedContext.Result is OkObjectResult or NoContentResult or CreatedResult or CreatedAtActionResult or OkResult)
		{
			string? newValue = null;				// Capture new value for Create/Update operations
				if ((Action == AuditAction.Create || Action == AuditAction.Update) && CaptureRequestBody)
				{
					// Try to get the input from action arguments
					var inputArg = context.ActionArguments.FirstOrDefault(a => 
						a.Key.ToLower() == "input" || 
						a.Key.ToLower() == "dto" ||
						a.Key.ToLower() == "request" ||
						a.Key.ToLower() == "model");

					if (inputArg.Value != null)
					{
						try
						{
							newValue = JsonSerializer.Serialize(inputArg.Value, new JsonSerializerOptions
							{
								WriteIndented = false,
								DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
							});
						}
						catch
						{
							newValue = inputArg.Value.ToString();
						}
					}
				}

			// Try to extract entity ID from result for Create operations
			if (Action == AuditAction.Create)
			{
				try
				{
					object? resultValue = null;
					
					if (executedContext.Result is OkObjectResult okResult)
					{
						resultValue = okResult.Value;
					}
					else if (executedContext.Result is CreatedAtActionResult createdAtActionResult)
					{
						resultValue = createdAtActionResult.Value;
					}
					else if (executedContext.Result is CreatedResult createdResult)
					{
						resultValue = createdResult.Value;
					}
					
					if (resultValue != null)
					{
						var idProperty = resultValue.GetType().GetProperty("id") ?? 
						                resultValue.GetType().GetProperty("Id") ??
						                resultValue.GetType().GetProperty("accountId") ??
						                resultValue.GetType().GetProperty("AccountId");
						
						if (idProperty != null)
						{
							var idValue = idProperty.GetValue(resultValue);
							if (idValue is Guid createdId)
							{
								entityId = createdId;
							}
							else if (idValue is string strId && Guid.TryParse(strId, out var parsedId))
							{
								entityId = parsedId;
							}
						}
					}
				}
				catch { }
			}				// Create audit log
				var auditLogDto = new CreateAuditLogDto
				{
					UserId = userId,
					UserName = userName,
					UserRole = userRole,
					Action = Action,
					EntityName = EntityName,
					EntityId = entityId,
					NewValue = newValue,
					Description = $"{Action} {EntityName}" + (entityId.HasValue ? $" (ID: {entityId})" : "")
				};

				try
				{
					await auditLogService.CreateAuditLogAsync(auditLogDto);
				}
				catch
				{
				}
			}
		}
	}
}
