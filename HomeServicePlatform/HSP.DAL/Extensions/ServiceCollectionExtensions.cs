using HSP.Core.Entities;
using HSP.DAL.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HSP.DAL.Extensions
{
	public static class ServiceCollectionExtensions
	{
		public static IServiceCollection AddDALServices(this IServiceCollection services, IConfiguration configuration)
		{
			services.AddDbContext<ApplicationDbContext>(options =>
					options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));
			services.AddIdentity<AppUser, AppRole>(o =>
			{
				o.User.RequireUniqueEmail = true;
				o.Password.RequiredLength = 8;
				o.Password.RequireNonAlphanumeric = false;
				o.Password.RequireUppercase = false;
				o.Password.RequireLowercase = true;
				o.Password.RequireDigit = true;
			}).AddEntityFrameworkStores<ApplicationDbContext>()
				.AddDefaultTokenProviders();
			return services;
		}
	}
}
