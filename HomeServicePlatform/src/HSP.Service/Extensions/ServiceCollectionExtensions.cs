using HSP.Core.Entities;
using HSP.Core.Interfaces.External;
using HSP.Service.Implementations;
using HSP.Service.Interfaces;
using Microsoft.Extensions.DependencyInjection;

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
			return services;
		}
	}
}
