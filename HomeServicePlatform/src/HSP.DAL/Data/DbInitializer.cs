using HSP.Core.Constans;
using HSP.Core.Entities;
using HSP.DAL.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HSP.DAL.Data
{
	public class DbInitializer : IDbInitializer
	{
		private readonly RoleManager<AppRole> _roleManager;
		private readonly UserManager<AppUser> _userManager;
		private readonly ApplicationDbContext _context;

		public DbInitializer(
			 ApplicationDbContext context,
			 RoleManager<AppRole> roleManager,
			 UserManager<AppUser> userManager)
		{
			_context = context;
			_roleManager = roleManager;
			_userManager = userManager;
		}

		public async Task InitializeAsync()
		{
			var roles = new[] {
				RoleNames.Admin,
				RoleNames.Operator,
				RoleNames.Technician,
				RoleNames.Customer,
				RoleNames.EquipmentManager,
				RoleNames.Supporter
			};

			foreach (var role in roles)
			{
				if (!await _roleManager.RoleExistsAsync(role))
				{
					await _roleManager.CreateAsync(new AppRole { Name = role });
				}
			}
			string adminEmail = "admin@gmail.com";
			string adminPassword = "123Qwe@@";

			var adminUser = await _userManager.FindByEmailAsync(adminEmail);
			if (adminUser == null)
			{
				var user = new AppUser
				{
					Email = adminEmail,
					UserName = adminEmail,
					FullName = "System Administrator",
					EmailConfirmed = true
				};

				var result = await _userManager.CreateAsync(user, adminPassword);
				if (result.Succeeded)
				{
					await _userManager.AddToRoleAsync(user, RoleNames.Admin);
				}
			}
			if (!await _context.ObjectTypes.AnyAsync())
			{
				var objectTypes = new List<ObjectType>{
					new ObjectType
					{
						Id = Guid.NewGuid(),
						Name = RoleNames.Technician,
						Description = "Hồ sơ kỹ thuật viên"
					},
					new ObjectType
					{
						Id = Guid.NewGuid(),
						Name = RoleNames.Customer,
						Description = "Avatar khách hàng"
					},
					new ObjectType
					{
						Id = Guid.NewGuid(),
						Name = "User",
						Description = "Avatar người dùng"
					}
				};

				await _context.ObjectTypes.AddRangeAsync(objectTypes);
				await _context.SaveChangesAsync();
			}
			else
			{
				// Đảm bảo ObjectType "User" tồn tại (cho trường hợp database đã có dữ liệu)
				var userObjectType = await _context.ObjectTypes.FirstOrDefaultAsync(x => x.Name == "User");
				if (userObjectType == null)
				{
					await _context.ObjectTypes.AddAsync(new ObjectType
					{
						Id = Guid.NewGuid(),
						Name = "User",
						Description = "Avatar người dùng"
					});
					await _context.SaveChangesAsync();
				}
			}
		}
	}
}
