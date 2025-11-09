using HSP.Core.Abstractions.External;
using HSP.Core.Entities;
using HSP.Core.Interfaces.External;
using HSP.Service.Implementations;
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
			services.AddScoped<ISupplierService, SupplierService>();
			services.AddScoped<IBookingService, BookingService>();
			services.AddScoped<ITechnicianLocationService, TechnicianLocationService>();
			services.AddScoped<IChatbotService, ChatbotService>();
			services.AddScoped<IChatService, ChatService>();
			services.AddScoped<ISePayService, SePayService>();
			services.AddScoped<IPaymentService, PaymentService>();
			services.AddHttpClient("SePay");
			services.AddSingleton<TesseractEngine>(sp =>
			{
				var tessdataPath = Path.Combine(AppContext.BaseDirectory, "tessdata");

				if (!Directory.Exists(tessdataPath))
				{
					throw new DirectoryNotFoundException($"Không tìm thấy thư mục 'tessdata' tại: {tessdataPath}. " +
							"Hãy đảm bảo bạn đã tạo thư mục 'tessdata' trong HSP.API và set 'Copy if newer'.");
				}

				try
				{
					return new TesseractEngine(tessdataPath, "vie+eng", EngineMode.Default);
				}
				catch (TesseractException ex)
				{
					Console.WriteLine(ex.Message);
					throw;
				}
			});
			services.AddScoped<IOcrService, OcrService>();
			return services;
		}
	}
}
