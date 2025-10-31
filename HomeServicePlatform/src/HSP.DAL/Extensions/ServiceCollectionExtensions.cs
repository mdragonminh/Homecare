using HSP.Core.Abstractions.DataAccess;
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
			services.Configure<DataProtectionTokenProviderOptions>(opt =>
			{
				opt.TokenLifespan = TimeSpan.FromMinutes(10);
			});

			services.AddScoped<IUserRepository, UserRepository>();
			services.AddScoped<IRoleRepository, RoleRepository>();
			services.AddScoped<IRepository<TechnicianProfile, Guid>, Repository<TechnicianProfile, Guid>>();
			services.AddScoped<IRepository<Home, Guid>, Repository<Home, Guid>>();
			services.AddScoped<IRepository<HomeItem, Guid>, Repository<HomeItem, Guid>>();
			services.AddScoped<IRepository<Core.Entities.Service, Guid>, Repository<Core.Entities.Service, Guid>>();
			services.AddScoped<IRepository<HSP.Core.Entities.File, Guid>, Repository<HSP.Core.Entities.File, Guid>>();
			services.AddScoped<IRepository<FileRelation, Guid>, Repository<FileRelation, Guid>>();
			services.AddScoped<IRepository<ObjectType, Guid>, Repository<ObjectType, Guid>>();
			services.AddScoped<IRepository<Warehouse, Guid>, Repository<Warehouse, Guid>>();
			services.AddScoped<IRepository<Equipment, Guid>, Repository<Equipment, Guid>>();
			services.AddScoped<IRepository<Booking, Guid>, Repository<Booking, Guid>>();
			services.AddScoped<IRepository<ChatMessageHistory, Guid>, Repository<ChatMessageHistory, Guid>>();
			services.AddScoped<IRepository<BookingItem, Guid>, Repository<BookingItem, Guid>>();
			services.AddScoped<IRepository<Ticket, Guid>, Repository<Ticket, Guid>>();
			services.AddScoped<IRepository<ChatConversation, Guid>, Repository<ChatConversation, Guid>>();
			services.AddScoped<IRepository<ChatMessage, Guid>, Repository<ChatMessage, Guid>>();
			services.AddScoped<IRepository<ChatAttachment, Guid>, Repository<ChatAttachment, Guid>>();

			services.AddScoped<IUnitOfWork, UnitOfWork>();
			services.AddScoped<IDbInitializer, DbInitializer>();
			return services;
		}
	}
}
