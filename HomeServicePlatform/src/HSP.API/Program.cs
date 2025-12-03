using HSP.API.Extensions;
using HSP.API.Hubs;
using HSP.Core.Constans;
using HSP.Core.Constants.SystemSettings;
using HSP.Core.Dtos.ConfigurationDto;
using HSP.Core.Resources;
using HSP.DAL.Extensions;
using HSP.DAL.Interfaces;
using HSP.Service.Extensions;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Identity;

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
            builder.Services.Configure<OpenAISettingsDto>(builder.Configuration.GetSection("OpenAI"));
            builder.Services.Configure<SePayConfigurationDto>(builder.Configuration.GetSection("SePay"));
            builder.Services.AddRazorTemplating();
            builder.Services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = builder.Configuration.GetConnectionString("Redis");
                options.InstanceName = "HSP_";
            });

            builder.Services.AddDALServices(builder.Configuration);
            

            builder.Services.AddServiceServices();
            builder.Services.AddUserAuthentication(builder.Configuration);

            builder.Services.AddSignalR();

            var app = builder.Build();
            await using (var scope = app.Services.CreateAsyncScope())
            {
                var settingService = scope.ServiceProvider.GetRequiredService<ISystemSettingService>();

                int minutes = await settingService.GetValueAsync<int>(
                    SystemSettingRegistry.Keys.EmailTokenLifespanMinutes
                );

                var options = scope.ServiceProvider
                    .GetRequiredService<Microsoft.Extensions.Options.IOptions<DataProtectionTokenProviderOptions>>()
                    .Value;

                options.TokenLifespan = TimeSpan.FromMinutes(minutes);
            }

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            await using (var scope = app.Services.CreateAsyncScope())
            {
                var initializer = scope.ServiceProvider.GetRequiredService<IDbInitializer>();
                await initializer.InitializeAsync();
            }

            if (!app.Environment.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }
            app.UseStaticFiles();
            app.UseRouting();
            app.UseCors(CorsConstants.AllowFrontendPolicy);
            app.UseWebSockets();
            app.UseRequestLocalization();
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapHub<ChatHub>("/hubs/chat");
            app.MapControllers();
            app.Run();
        }
    }
}