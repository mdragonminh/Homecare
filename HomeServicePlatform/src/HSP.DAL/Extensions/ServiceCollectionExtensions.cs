using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.DAL.Data;
using HSP.DAL.Interfaces;
using HSP.DAL.Repositories;
using HSP.DAL.UnitOfWorks;
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
				o.SignIn.RequireConfirmedEmail = true;
			}).AddEntityFrameworkStores<ApplicationDbContext>()
				.AddDefaultTokenProviders();
			services.Configure<DataProtectionTokenProviderOptions>(options =>
			{
				options.TokenLifespan = TimeSpan.FromMinutes(10); 
			});
			services.AddScoped<IUserRepository, UserRepository>();
			services.AddScoped<IRepository<TechnicianProfile, Guid>, Repository<TechnicianProfile,Guid>>();
			services.AddScoped<IRepository<CustomerProfile, Guid>, Repository<CustomerProfile, Guid>>();
			services.AddScoped<IRepository<Home, Guid>, Repository<Home, Guid>>();
			services.AddScoped<IRepository<HomeItem, Guid>, Repository<HomeItem, Guid>>();
			services.AddScoped<IRepository<Core.Entities.Service, Guid>, Repository<Core.Entities.Service, Guid>>();
			services.AddScoped<IRepository<ServiceCategory, Guid>, Repository<ServiceCategory, Guid>>();
			services.AddScoped<IUnitOfWork, UnitOfWork>();
			services.AddScoped<IDbInitializer, DbInitializer>();
			return services;
		}
	}
}
