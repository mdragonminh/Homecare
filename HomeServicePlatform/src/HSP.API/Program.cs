using HSP.API.Extensions;
using HSP.Core.Constans;
using HSP.Core.Dtos.ConfigurationDto;
using HSP.Core.Resources;
using HSP.DAL.Extensions;
using HSP.DAL.Interfaces;
using HSP.Service.Extensions;

namespace HSP.API
{
	public class Program
	{
		public static async Task Main(string[] args)
		{
			var builder = WebApplication.CreateBuilder(args);
			builder.Services.Configure<RequestLocalizationOptions>(options =>
			{
				var localizationSettings = builder.Configuration
																					.GetSection("LocalizationSettings")
																					.Get<LocalizationSettingsDto>();

				if (localizationSettings != null && localizationSettings.SupportedCultures?.Length > 0)
				{
					options.SetDefaultCulture(localizationSettings.DefaultCulture);
					options.AddSupportedCultures(localizationSettings.SupportedCultures);
					options.AddSupportedUICultures(localizationSettings.SupportedCultures);
				}
			});

			builder.Services.AddLocalization();
			// Add services to the container.
			builder.Services.AddControllers().AddDataAnnotationsLocalization(options =>
			{
				options.DataAnnotationLocalizerProvider = (type, factory) =>
						factory.Create(typeof(SharedResource));
			}); ;
			// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
			builder.Services.AddEndpointsApiExplorer();
			builder.Services.AddSwaggerGen();


			builder.Services.AddCors(options =>
			{
				options.AddPolicy(CorsConstants.AllowFrontendPolicy,
						policy =>
						{
							policy.WithOrigins("http://localhost:5173")
								.AllowAnyHeader()
								.AllowAnyMethod()
								.AllowCredentials();
						});
			});

			builder.Services.Configure<SmtpConfigurationDto>(builder.Configuration.GetSection("Smtp"));
			builder.Services.Configure<JwtSettingsDto>(builder.Configuration.GetSection("JwtSettings"));
			builder.Services.Configure<GoogleAuthConfigurationDto>(builder.Configuration.GetSection("Google"));
			builder.Services.Configure<GoogleMapConfigurationDto>(builder.Configuration.GetSection("GoogleMaps"));
			builder.Services.Configure<LocalizationSettingsDto>(builder.Configuration.GetSection("LocalizationSettings"));
			builder.Services.Configure<UrlSettingsDto>(builder.Configuration.GetSection("UrlSettings"));

			builder.Services.AddRazorTemplating();

			builder.Services.AddDALServices(builder.Configuration);
			builder.Services.AddServiceServices();
			builder.Services.AddUserAuthentication(builder.Configuration);

			var app = builder.Build();

			// Configure the HTTP request pipeline.
			if (app.Environment.IsDevelopment())
			{
				app.UseSwagger();
				app.UseSwaggerUI();
			}
			using (var scope = app.Services.CreateScope())
			{
				var initializer = scope.ServiceProvider.GetRequiredService<IDbInitializer>();
				await initializer.InitializeAsync();
			}

			app.UseHttpsRedirection();

			app.UseCors(CorsConstants.AllowFrontendPolicy);

			app.UseRequestLocalization();

			app.UseAuthentication();
			app.UseAuthorization();

			app.MapControllers();

			app.Run();
		}
	}
}
