using HSP.Core.Resources;
using HSP.DAL.Extensions;
using HSP.DAL.Interfaces;
using HSP.Service.Extensions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace HSP.API
{
	public class Program
	{
		public static async Task Main(string[] args)
		{
			var builder = WebApplication.CreateBuilder(args);

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
				options.AddPolicy("AllowFrontend",
						policy =>
						{
							policy.WithOrigins("http://localhost:5173")
								.AllowAnyHeader()
								.AllowAnyMethod()
								.AllowCredentials();
						});
			});
			builder.Services.AddDALServices(builder.Configuration);
			builder.Services.AddServiceServices();
			builder.Services.AddAuthentication(options =>
			{
				options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
				options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
			})
			.AddJwtBearer(options =>
			{
				options.TokenValidationParameters = new TokenValidationParameters
				{
					ValidateIssuer = true,
					ValidateAudience = true,
					ValidateLifetime = true,
					ValidateIssuerSigningKey = true,
					ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
					ValidAudience = builder.Configuration["JwtSettings:Audience"],
					IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:SecretKey"]))
				};
			}).AddGoogle(options =>
			{
				options.ClientId = builder.Configuration["Google:ClientId"];
				options.ClientSecret = builder.Configuration["Google:ClientSecret"];
			}); 

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

			app.UseCors("AllowFrontend");

			var supportedCultures = new[] { "vi-VN", "en-US" };
			var localizationOptions = new RequestLocalizationOptions()
					.SetDefaultCulture(supportedCultures[0]) 
					.AddSupportedCultures(supportedCultures)
					.AddSupportedUICultures(supportedCultures);

			app.UseRequestLocalization(localizationOptions);

			app.UseAuthentication();
			app.UseAuthorization();

			app.MapControllers();

			app.Run();
		}
	}
}
