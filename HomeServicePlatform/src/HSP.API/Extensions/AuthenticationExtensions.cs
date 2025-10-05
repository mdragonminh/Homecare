using HSP.Core.Dtos.ConfigurationDto;
using Microsoft.AspNetCore.Authentication.JwtBearer;
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
			}).AddGoogle(options =>
			{
				options.ClientId = googleAuthConfig.ClientId;
				options.ClientSecret = googleAuthConfig.ClientSecret;
			});
			return services;
		}
	}
}
