using HSP.Core.Abstractions.External;
using HSP.Core.Entities;
using HSP.Core.Interfaces.External;
using HSP.Service.Implementations;
using HSP.Service.Implementations.External;
using HSP.Service.Implementations.Internal;
using HSP.Service.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Tesseract;

namespace HSP.Service.Extensions
{
	public static class ServiceCollectionExtensions
	{
		public static IServiceCollection AddServiceServices(this IServiceCollection services)
		{
			services.AddScoped<IJwtService, JwtService>();
			services.AddScoped<IAuthenticationService, AuthenticationService>();
			services.AddScoped<IAccountManagementService, AccountManagementService>();
			services.AddScoped<IEmailService, EmailService>();
			services.AddScoped<IAuthSignInService, AuthSignInService>();
			services.AddScoped<IFileService, FileService>();
			services.AddScoped<IHomeService, HomeService>();
			services.AddScoped<IGeocodingService, GoogleMapsGeocodingService>();
			services.AddScoped<IHomeItemService, HomeItemService>();
			services.AddScoped<ICustomerProfileService, CustomerProfileService>();
			services.AddScoped<ITechnicianProfileService, TechnicianProfileService>();
			services.AddScoped<ITicketService, TicketService>();
			services.AddHttpClient("GoogleMaps", client =>
			{
				client.BaseAddress = new Uri("https://maps.googleapis.com/maps/api/");
			});
			services.AddScoped<IRedisCacheService, RedisCacheService>();
			services.AddScoped<IEmailTemplateService, EmailTemplateService>();
			services.AddScoped<IHomeServiceService, HomeServiceService>();
			services.AddScoped<IServiceRequestService, ServiceRequestService>();
			services.AddScoped<IWarehouseService, WarehouseService>();
			services.AddScoped<IEquipmentService, EquipmentService>();
			services.AddScoped<IBookingService, BookingService>();
			services.AddScoped<ITechnicianLocationService, TechnicianLocationService>();
			services.AddScoped<IChatbotService, ChatbotService>();
			services.AddScoped<IChatService, ChatService>();
			services.AddScoped<ISePayService, SePayService>();
			services.AddScoped<IPaymentService, PaymentService>();
			services.AddScoped<IFeedbackService, FeedbackService>();
			services.AddScoped<ISystemSettingService, SystemSettingService>();
			services.AddHttpClient("SePay");
			services.AddScoped<IOcrService, OcrService>();
			return services;
		}
	}
}
