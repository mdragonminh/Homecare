using HSP.Core.Dtos.ConfigurationDto;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace HSP.API.Extensions
{
	public static class AuthenticationExtensions
	{
		public static IServiceCollection AddUserAuthentication(this IServiceCollection services, IConfiguration configuration)
		{
			var jwtSettings = configuration.GetSection("JwtSettings").Get<JwtSettingsDto>();
			var googleAuthConfig = configuration.GetSection("Google").Get<GoogleAuthConfigurationDto>();
			if (jwtSettings == null || googleAuthConfig == null)
			{
				throw new InvalidOperationException("Authentication settings are not configured properly.");
			}
			services.AddAuthentication(options =>
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
					ValidIssuer = jwtSettings.Issuer,
					ValidAudience = jwtSettings.Audience,
					IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey))
				};

				// Support SignalR token from query string
				options.Events = new JwtBearerEvents
				{
					OnMessageReceived = context =>
					{
						var accessToken = context.Request.Query["access_token"];
						var path = context.HttpContext.Request.Path;
						
						if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chathub"))
						{
							context.Token = accessToken;
						}
						
						return Task.CompletedTask;
					},
					OnTokenValidated = async context =>
					{
						// Check if user is still active when token is validated
						var userManager = context.HttpContext.RequestServices.GetRequiredService<UserManager<HSP.Core.Entities.AppUser>>();
						var userIdClaim = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
						
						if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
						{
							var user = await userManager.FindByIdAsync(userId.ToString());
							if (user == null || !user.IsActive)
							{
								context.Fail("Tài khoản của bạn đã bị xóa hoặc vô hiệu hóa");
							}
						}
					}
				};
			}).AddGoogle(options =>
			{
				options.ClientId = googleAuthConfig.ClientId;
				options.ClientSecret = googleAuthConfig.ClientSecret;
                options.SignInScheme = IdentityConstants.ExternalScheme;
            });
			return services;
		}
	}
}