using HSP.Service.Implementations;
using HSP.Service.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace HSP.Service.Extensions
{
	public static class ServiceCollectionExtensions
	{
		public static IServiceCollection AddServiceServices(this IServiceCollection services)
		{
			services.AddScoped<IAuthenticationService, AuthenticationService>();
			services.AddScoped<IEmailService, EmailService>();
			return services;
		}
	}
}
